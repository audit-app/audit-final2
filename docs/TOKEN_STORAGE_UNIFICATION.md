# Unificación de Configuración de Token Storage

## 🔴 Problema Original

Había **inconsistencia** en cómo se configuraban los TTL y límites de sesiones entre diferentes repositorios:

### Antes (Inconsistente):

**TrustedDeviceRepository** ✅
```typescript
constructor(cacheService: CacheService) {
  super(cacheService, {
    basePrefix: 'auth:trusted-device',
    maxItemsPerUser: 10,                                           // Hardcodeado
    ttlSeconds: envs.twoFactor.trustedDeviceExpirationSeconds,   // ✅ Usa ENV
  })
}
```

**TokenStorageRepository** ❌
```typescript
constructor(cacheService: CacheService) {
  super(cacheService, {
    basePrefix: 'auth:refresh',
    maxItemsPerUser: 5,                  // ❌ HARDCODEADO
    ttlSeconds: 60 * 60 * 24 * 7,       // ❌ HARDCODEADO (7 días)
  })
}
```

## ✅ Solución Implementada

### 1. **Nueva variable de entorno** (`src/@core/config/envs.ts`)

```typescript
// Joi Schema
SESSION_SECRET: Joi.string().required().min(32).messages({...}),
SESSION_MAX_AGE: Joi.number().default(86400000), // 24h in ms
MAX_CONCURRENT_SESSIONS_PER_USER: Joi.number().min(1).max(50).default(5), // ✅ NUEVA

// Export
session: {
  secret: validatedEnv.SESSION_SECRET as string,
  maxAge: validatedEnv.SESSION_MAX_AGE as number,
  maxConcurrentSessions: validatedEnv.MAX_CONCURRENT_SESSIONS_PER_USER as number, // ✅ NUEVA
},
```

### 2. **Actualizado `.env`**

```bash
# ============================================
# SESSION / COOKIES
# ============================================
SESSION_SECRET=your-session-secret-change-this-in-production
SESSION_MAX_AGE=86400000

# Máximo de sesiones concurrentes por usuario (refresh tokens activos)
# Si el usuario supera este límite, se elimina la sesión más antigua
MAX_CONCURRENT_SESSIONS_PER_USER=5  # ✅ NUEVA VARIABLE
```

### 3. **Actualizado TokenStorageRepository**

```typescript
import { envs } from '@core/config'  // ✅ Importado

@Injectable()
export class TokenStorageRepository extends AbstractUserSetRepository<StoredSession> {
  constructor(cacheService: CacheService) {
    super(cacheService, {
      basePrefix: 'auth:refresh',
      maxItemsPerUser: envs.session.maxConcurrentSessions,   // ✅ Desde ENV
      ttlSeconds: envs.jwt.refreshExpirationSeconds,         // ✅ Desde ENV
    })
  }
  // ...
}
```

## 📊 Comparación: Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **TTL Refresh Token** | `60 * 60 * 24 * 7` (hardcoded) | `envs.jwt.refreshExpirationSeconds` ✅ |
| **Max Sesiones** | `5` (hardcoded) | `envs.session.maxConcurrentSessions` ✅ |
| **Consistencia** | ❌ Inconsistente entre repos | ✅ Unificado |
| **Configurabilidad** | ❌ Requiere cambio de código | ✅ Solo cambiar `.env` |

## 🎯 Beneficios

### ✅ **Consistencia**
- Todos los repositorios usan la misma estrategia (ENV)
- No hay valores mágicos hardcodeados

### ✅ **Flexibilidad**
```bash
# Desarrollo: más sesiones, tokens más largos
JWT_REFRESH_EXPIRES_IN=7d
MAX_CONCURRENT_SESSIONS_PER_USER=10

# Producción: más restrictivo
JWT_REFRESH_EXPIRES_IN=1d
MAX_CONCURRENT_SESSIONS_PER_USER=3
```

### ✅ **Mantenibilidad**
- Cambiar valores sin tocar código
- Documentación centralizada en `.env`
- Validación automática con Joi

## 🔧 Configuración Recomendada

### Desarrollo
```bash
JWT_REFRESH_EXPIRES_IN=7d              # 7 días
MAX_CONCURRENT_SESSIONS_PER_USER=10    # Múltiples dispositivos
TRUSTED_DEVICE_TTL_DAYS=90             # 3 meses
```

### Staging
```bash
JWT_REFRESH_EXPIRES_IN=3d              # 3 días
MAX_CONCURRENT_SESSIONS_PER_USER=5     # Balance
TRUSTED_DEVICE_TTL_DAYS=30             # 1 mes
```

### Producción
```bash
JWT_REFRESH_EXPIRES_IN=1d              # 1 día (más seguro)
MAX_CONCURRENT_SESSIONS_PER_USER=3     # Restrictivo
TRUSTED_DEVICE_TTL_DAYS=14             # 2 semanas
```

## 📋 Checklist: Cómo cambiar configuración

1. **Editar `.env`**
   ```bash
   MAX_CONCURRENT_SESSIONS_PER_USER=3
   JWT_REFRESH_EXPIRES_IN=1d
   ```

2. **Reiniciar aplicación**
   ```bash
   npm run dev
   ```

3. **Verificar en logs**
   ```
   ✅ Configuración cargada correctamente
   ```

## 🚀 Migración (si tienes entornos existentes)

### Paso 1: Agregar variable a `.env`
```bash
# .env, .env.staging, .env.production
MAX_CONCURRENT_SESSIONS_PER_USER=5
```

### Paso 2: Verificar valores por defecto
Si NO agregas la variable, el sistema usa el valor por defecto: `5`

### Paso 3: Testing
```bash
# Test E2E verifica que funcione
npm run test:e2e -- auth.e2e-spec.ts
```

## 🔍 Valores Relacionados

Todas estas configuraciones están en `.env`:

```bash
# JWT
JWT_EXPIRES_IN=15m                      # Access token (corta duración)
JWT_REFRESH_EXPIRES_IN=7d               # Refresh token (larga duración)

# Sesiones
MAX_CONCURRENT_SESSIONS_PER_USER=5      # ✅ NUEVA - Sesiones simultáneas

# 2FA
TWO_FACTOR_CODE_EXPIRES_IN=5m           # Código 2FA
TRUSTED_DEVICE_TTL_DAYS=90              # Dispositivo confiable

# Reset Password
RESET_PASSWORD_TOKEN_EXPIRES_IN=1h      # Token de reset

# Email Verification
EMAIL_VERIFICATION_EXPIRES_IN=7d        # Token de verificación
```

## 💡 Notas Importantes

### TTL en Redis
Los valores de `ttlSeconds` se traducen directamente a TTL en Redis:

```typescript
// TokenStorageRepository
ttlSeconds: envs.jwt.refreshExpirationSeconds  // 7d = 604800 segundos

// Redis key expiration
await redis.setex('auth:refresh:userId:tokenId', 604800, value)
```

### Límite de sesiones (maxItemsPerUser)
Cuando un usuario supera el límite, se elimina la sesión **más antigua** (por `lastActiveAt`):

```typescript
// AbstractUserSetRepository.save()
if (allItems.length > this.maxItemsPerUser) {
  // Ordena por lastActiveAt y elimina las más viejas
  const toRemove = allItems
    .sort((a, b) => this.getLastActive(a) - this.getLastActive(b))
    .slice(0, allItems.length - this.maxItemsPerUser)

  // Elimina de Redis
  await this.deleteMany(userId, toRemove.map(item => this.getItemId(item)))
}
```

### Seguridad
- ✅ **Valores mínimos validados**: Joi valida que `maxConcurrentSessions` esté entre 1 y 50
- ✅ **Formato de tiempo validado**: `JWT_REFRESH_EXPIRES_IN` debe ser formato `Xd` (días), `Xh` (horas), `Xm` (minutos)
- ✅ **Fail-fast**: Si la configuración es inválida, la app NO inicia

## 🧪 Testing

### Verificar que usa ENV:
```typescript
// test/auth.e2e-spec.ts
it('should respect MAX_CONCURRENT_SESSIONS limit', async () => {
  const maxSessions = envs.session.maxConcurrentSessions

  // Login N+1 veces
  for (let i = 0; i <= maxSessions; i++) {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
  }

  // Verificar que solo quedan maxSessions en Redis
  const sessions = await redis.keys(`auth:refresh:${userId}:*`)
  expect(sessions.length).toBe(maxSessions)
})
```

## 📚 Referencias

- **Archivo de config**: `src/@core/config/envs.ts`
- **TokenStorageRepository**: `src/modules/auth/core/services/token-storage.repository.ts`
- **TrustedDeviceRepository**: `src/modules/auth/session/devices/repositories/trusted-device.repository.ts`
- **AbstractUserSetRepository**: `src/@core/cache/cache.repository.ts`
- **Validación Joi**: `src/@core/config/envs.ts` (línea 113)

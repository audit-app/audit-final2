# 🔧 Fix: 2FA no generaba tokens en Redis

## 🐛 Problema Identificado

El sistema 2FA no estaba generando tokens en Redis debido a:

1. **Expiración mal parseada**: `TWO_FACTOR_CODE_EXPIRES_IN=5m` se parseaba como `5 segundos` en lugar de `300 segundos` (5 minutos)
2. **Secret demasiado corto**: `TWO_FACTOR_JWT_SECRET=ysweefe` (7 caracteres) debe tener mínimo 32 caracteres

## ✅ Cambios Realizados

### 1. Actualizado `two-factor.config.ts`

Agregado función `parseTimeToSeconds()` que soporta:
- Formato de tiempo: `5m`, `1h`, `30s`
- Números directos: `300`

```typescript
// ANTES (❌ solo parseaba números)
expiresIn: parseInt(process.env.TWO_FACTOR_CODE_EXPIRES_IN || '300', 10)

// AHORA (✅ parsea ambos formatos)
expiresIn: parseTimeToSeconds(process.env.TWO_FACTOR_CODE_EXPIRES_IN, 300)
```

### 2. Actualizado `envs.ts`

Agregado validador flexible en Joi:
```typescript
const flexibleTimeValidator = Joi.alternatives()
  .try(
    Joi.string().pattern(/^\d+[smhd]$/), // 5m, 1h, 30s
    Joi.string().pattern(/^\d+$/), // 300
  )
```

### 3. Scripts de Testing

- **`test-config.ts`** - Verifica configuración de 2FA
- **`test-redis.ts`** - Prueba completa de generación/validación con Redis

## 🔧 Cómo Arreglar

### Paso 1: Actualizar `.env`

Reemplaza estas líneas en tu `.env`:

```bash
# ❌ ANTES (secret muy corto)
TWO_FACTOR_JWT_SECRET=ysweefe

# ✅ DESPUÉS (32+ caracteres)
TWO_FACTOR_JWT_SECRET=0sJg87XCr7ZpkIdPQPAhL+vo4hifTtDlGnIQGakCE3o=
```

Mantén el formato de expiración como está (ahora funciona):
```bash
TWO_FACTOR_CODE_EXPIRES_IN=5m  # ✅ Ahora se parsea correctamente como 300 segundos
```

### Paso 2: Verificar configuración

```bash
npx ts-node --files -r tsconfig-paths/register src/modules/auth/two-factor/test-config.ts
```

Debes ver:
```
✅ Expiración del código OK: 5 minutos
✅ TWO_FACTOR_JWT_SECRET configurado correctamente
✅ Configuración de 2FA correcta!
```

### Paso 3: Probar con Redis (Opcional)

```bash
# Asegúrate que Redis esté corriendo
docker-compose up -d

# Ejecutar test completo
npx ts-node --files -r tsconfig-paths/register src/modules/auth/two-factor/test-redis.ts
```

Debes ver:
```
✅ Código generado
✅ Token encontrado en Redis
✅ Código validado correctamente
✅ 2FA está funcionando correctamente con Redis
```

### Paso 4: Reiniciar la app

```bash
npm run start:dev
```

## 🎯 Resultado Esperado

Ahora cuando hagas login con un usuario que tiene 2FA habilitado:

1. ✅ Se genera un código de 6 dígitos
2. ✅ Se guarda en Redis con TTL de 5 minutos
3. ✅ Se envía por email
4. ✅ El token dura 5 minutos (no 5 segundos)
5. ✅ La validación funciona correctamente

## 📋 Variables de Entorno Relacionadas

```bash
# Código 2FA
TWO_FACTOR_CODE_LENGTH=6                    # Longitud del código (4-8 dígitos)
TWO_FACTOR_CODE_EXPIRES_IN=5m               # Expiración (5m, 300, 1h, etc.)
TWO_FACTOR_JWT_SECRET=<32+ caracteres>      # Secret para firmar tokens

# Rate Limiting
TWO_FACTOR_RESEND_COOLDOWN_SECONDS=60       # Espera entre resends
TWO_FACTOR_VERIFY_MAX_ATTEMPTS=3            # Máximo intentos de verificación
TWO_FACTOR_VERIFY_WINDOW_MINUTES=10         # Ventana de tiempo para intentos
```

## 🔍 Debugging

Si el 2FA sigue sin funcionar:

### 1. Verificar Redis
```bash
# Conectar a Redis
docker exec -it <redis-container> redis-cli

# Listar keys de 2FA
KEYS auth:2fa-login:*

# Ver un token específico
GET auth:2fa-login:<token-id>

# Ver TTL
TTL auth:2fa-login:<token-id>
```

### 2. Revisar logs
```bash
# La app debe mostrar:
# - "Generating 2FA code for user..."
# - "2FA code stored in Redis with TTL..."
# - "Sending 2FA code via email..."
```

### 3. Verificar email
- El código debe llegar por email
- Si no llega, verifica la configuración SMTP

## 📖 Documentación Relacionada

- `CLAUDE.md` - Sistema de tokens híbridos
- `src/@core/security/otp-core.service.ts` - Servicio base de OTP
- `src/modules/auth/two-factor/services/two-factor-token.service.ts` - Servicio 2FA

## 🎉 Resumen

✅ **Problema**: Expiración mal parseada + secret corto
✅ **Solución**: Parser flexible + secret de 32+ caracteres
✅ **Testing**: Scripts de verificación incluidos
✅ **Estado**: 2FA funcionando correctamente

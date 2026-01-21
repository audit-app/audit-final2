# 🚀 Quick Start: Nuevo Sistema de Configuración

## ✅ ¿Qué se implementó?

Sistema de configuración **sin boilerplate** con validación automática usando Joi.

### Características principales:
- ✅ **Sin DI** - No más `constructor(private config: AppConfigService) {}`
- ✅ **Validación automática** - Joi valida todas las env vars al inicio
- ✅ **Fail-fast** - Si hay errores, la app NO inicia
- ✅ **100% tipado** - TypeScript autocomplete completo
- ✅ **Readonly** - No se puede modificar accidentalmente

---

## 🎯 Uso Básico

### Antes (❌ Con boilerplate)
```typescript
import { Injectable } from '@nestjs/common'
import { AppConfigService } from '@core/config'

@Injectable()
export class MyService {
  constructor(private readonly config: AppConfigService) {} // ← Boilerplate

  someMethod() {
    const port = this.config.app.port
    const secret = this.config.auth.jwt.access.secret
  }
}
```

### Ahora (✅ Sin boilerplate)
```typescript
import { Injectable } from '@nestjs/common'
import { envs } from '@core/config'

@Injectable()
export class MyService {
  // ✨ No constructor!

  someMethod() {
    const port = envs.app.port
    const secret = envs.jwt.accessSecret
  }
}
```

---

## 📋 Configuración Requerida en `.env`

El sistema validó tu `.env` y encontró estos problemas:

```bash
# ⚠️ ESTOS VALORES NECESITAN CORRECCIÓN:

# 1. Deben tener mínimo 32 caracteres para seguridad
TWO_FACTOR_JWT_SECRET=tu-secret-aqui-minimo-32-caracteres-de-longitud
RESET_PASSWORD_JWT_SECRET=otro-secret-minimo-32-caracteres-longitud

# 2. Debe ser >= 1000 (1 segundo en milisegundos)
THROTTLE_TTL=60000  # 60 segundos recomendado
```

### Generar secrets seguros rápidamente:

```bash
# Opción 1: OpenSSL
openssl rand -base64 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opción 3: UUID + UUID
node -e "const {randomUUID}=require('crypto'); console.log(randomUUID()+randomUUID())"
```

---

## 📚 Variables Disponibles

### App
```typescript
envs.app.port             // number
envs.app.nodeEnv          // 'development' | 'production' | 'test' | 'staging'
envs.app.isDevelopment    // boolean
envs.app.isProduction     // boolean
```

### JWT
```typescript
envs.jwt.accessSecret         // string
envs.jwt.accessExpiresIn      // string (e.g., '15m')
envs.jwt.refreshSecret        // string
envs.jwt.refreshExpiresIn     // string (e.g., '7d')
```

### Redis
```typescript
envs.redis.host      // string
envs.redis.port      // number
envs.redis.password  // string
```

### Email
```typescript
envs.email.host       // string
envs.email.port       // number
envs.email.from       // string
envs.email.fromName   // string
```

### Security
```typescript
envs.security.bcryptRounds    // number
envs.security.corsOrigins     // string[]
envs.security.throttleTtl     // number
envs.security.throttleLimit   // number
```

Ver lista completa en `ENVS_USAGE.md`

---

## 🔧 Ejemplo Completo

```typescript
// src/modules/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { envs } from '@core/config'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envs.jwt.accessSecret, // ✅ Directo
    })
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email }
  }
}
```

---

## 🧪 Probar el Sistema

```bash
# Ejecutar ejemplo de uso
npx ts-node --files -r tsconfig-paths/register src/@core/config/example-usage.ts
```

Si tu `.env` está bien configurado, verás:

```
╔═══════════════════════════════════════════╗
║  🚀 AUDIT CORE                            ║
╠═══════════════════════════════════════════╣
║  Environment: development                 ║
║  Port:        3000                        ║
║  URL:         http://localhost:3000       ║
║  Swagger:     http://localhost:3000/api   ║
╚═══════════════════════════════════════════╝
```

---

## ⚡ Migración Rápida

### Paso 1: Buscar y reemplazar imports
```bash
# Buscar usos de AppConfigService
grep -r "AppConfigService" src/

# Reemplazar con envs
```

### Paso 2: Actualizar el código
```typescript
// ❌ ANTES
constructor(private readonly config: AppConfigService) {}

const port = this.config.app.port
const secret = this.config.auth.jwt.access.secret

// ✅ DESPUÉS
import { envs } from '@core/config'

const port = envs.app.port
const secret = envs.jwt.accessSecret
```

---

## 📖 Documentación Completa

- **`ENVS_USAGE.md`** - Guía completa con todas las variables y ejemplos
- **`example-usage.ts`** - Ejemplos prácticos de uso
- **`envs.ts`** - Código fuente del sistema

---

## 🎁 Ventajas Inmediatas

| Característica | Antes | Ahora |
|----------------|-------|-------|
| **Líneas de código** | 5+ (constructor + uso) | 2 (import + uso) |
| **Performance** | Llamada a método | Acceso directo |
| **Testing** | Mock complejo | Mock simple |
| **Validación** | Manual/ninguna | Automática |
| **Errores** | Runtime | Startup |

---

## ⚠️ Próximos Pasos

1. ✅ Corregir variables en `.env` (ver arriba)
2. 🔄 Migrar código existente progresivamente
3. 🗑️ Deprecar `AppConfigService` después de migración

---

**¿Dudas? Ver `ENVS_USAGE.md` para documentación completa.**

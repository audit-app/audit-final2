# Configuración Centralizada (@core/config)

Sistema centralizado para manejo de variables de entorno con acceso tipado.

---

## 🆕 NUEVO: Sistema con Validación Joi (Recomendado)

**⚡ Usa `envs` para código nuevo** - Sin boilerplate de DI, validación automática con Joi.

```typescript
import { envs } from '@core/config'

// ✅ Acceso directo, sin DI
const port = envs.app.port
const secret = envs.jwt.accessSecret
```

📖 **Ver documentación completa:**
- **[QUICK_START.md](./QUICK_START.md)** - Inicio rápido
- **[ENVS_USAGE.md](./ENVS_USAGE.md)** - Guía completa

---

## 🔧 Sistema Legacy (AppConfigService)

> ⚠️ **Deprecado**: Migra a `envs` para eliminar boilerplate.

## ¿Por qué?

**Antes (❌ Problemático):**
```typescript
// Código disperso, sin tipos, propenso a errores
constructor(private readonly configService: ConfigService) {}

const port = parseInt(this.configService.get<string>('PORT') || '3000', 10)
const jwtSecret = this.configService.get<string>('JWT_SECRET')
const redisHost = this.configService.get<string>('REDIS_HOST') || 'localhost'
```

**Ahora (✅ Mejorado):**
```typescript
// Centralizado, tipado, fácil de usar
constructor(private readonly config: AppConfigService) {}

const port = this.config.app.port // number (tipado automáticamente)
const jwtSecret = this.config.auth.jwt.access.secret // string
const redisHost = this.config.cache.redis.host // string
```

## Estructura

```
src/@core/config/
├── config.module.ts          # Módulo global (@Global)
├── config.service.ts         # Servicio centralizado de acceso
├── app.config.ts             # Configuración de aplicación
├── auth.config.ts            # JWT, 2FA, Password Reset, Google OAuth
├── email.config.ts           # SMTP, emails
├── cache.config.ts           # Redis
├── files.config.ts           # Uploads
├── security.config.ts        # Bcrypt, CORS, Throttle
├── frontend.config.ts        # URLs del frontend
├── swagger.config.ts         # Documentación API
├── pagination.config.ts      # Paginación
└── database.config.ts        # TypeORM (legacy, ya existía)
```

## Uso

### 1. El módulo es global

`AppConfigModule` está marcado con `@Global()`, por lo que **NO necesitas importarlo** en otros módulos. Solo importa en `AppModule` una vez.

```typescript
// app.module.ts
import { AppConfigModule } from '@core/config'

@Module({
  imports: [
    AppConfigModule, // ← Una sola vez aquí
    // ... otros módulos
  ],
})
export class AppModule {}
```

### 2. Inyectar y usar

En cualquier servicio, controlador o módulo:

```typescript
import { Injectable } from '@nestjs/common'
import { AppConfigService } from '@core/config'

@Injectable()
export class MyService {
  constructor(private readonly config: AppConfigService) {}

  someMethod() {
    // ✅ Acceso directo y tipado
    const isDev = this.config.app.isDevelopment
    const port = this.config.app.port

    // ✅ Configuración de autenticación
    const jwtSecret = this.config.auth.jwt.access.secret
    const jwtExpires = this.config.auth.jwt.access.expiresIn

    // ✅ Configuración de 2FA
    const codeLength = this.config.auth.twoFactor.code.length

    // ✅ Google OAuth
    const googleClientId = this.config.auth.google.clientId

    // ✅ Email
    const smtpHost = this.config.email.host
    const from = this.config.email.from

    // ✅ Redis
    const redisHost = this.config.cache.redis.host
    const redisPort = this.config.cache.redis.port

    // ✅ Frontend URLs
    const frontendUrl = this.config.frontend.url

    // ✅ Security
    const corsOrigins = this.config.security.cors.origins
  }
}
```

### 3. Autocomplete y tipos

TypeScript te dará autocompletado y verificación de tipos:

```typescript
this.config.app. // ← Autocomplete: port, name, url, isDevelopment, etc.
this.config.auth.jwt. // ← Autocomplete: access, refresh
this.config.auth.jwt.access. // ← Autocomplete: secret, expiresIn
```

## Secciones de Configuración

### App (Aplicación General)
```typescript
this.config.app.nodeEnv          // 'development' | 'production' | 'test' | 'staging'
this.config.app.port             // number
this.config.app.name             // string
this.config.app.url              // string
this.config.app.isDevelopment    // boolean
this.config.app.isProduction     // boolean
this.config.app.isTest           // boolean
```

### Auth (Autenticación)
```typescript
// JWT Access Token
this.config.auth.jwt.access.secret
this.config.auth.jwt.access.expiresIn

// JWT Refresh Token
this.config.auth.jwt.refresh.secret
this.config.auth.jwt.refresh.expiresIn
this.config.auth.jwt.refresh.expirationTime // En segundos (para Redis TTL)

// Two-Factor Authentication
this.config.auth.twoFactor.code.length
this.config.auth.twoFactor.code.expiresIn
this.config.auth.twoFactor.jwt.secret
this.config.auth.twoFactor.trustedDevice.expirationDays
this.config.auth.twoFactor.trustedDevice.expirationSeconds

// Password Reset
this.config.auth.passwordReset.jwt.secret
this.config.auth.passwordReset.token.expiresIn
this.config.auth.passwordReset.rateLimit.maxAttemptsByEmail
this.config.auth.passwordReset.rateLimit.windowMinutes

// Email Verification
this.config.auth.emailVerification.jwt.secret

// Login
this.config.auth.login.rateLimit.maxAttemptsByIp
this.config.auth.login.rateLimit.maxAttemptsByUser
this.config.auth.login.rateLimit.windowMinutes

// Session
this.config.auth.session.secret
this.config.auth.session.maxAge

// Device Fingerprint
this.config.auth.deviceFingerprint.salt

// Google OAuth
this.config.auth.google.clientId
this.config.auth.google.clientSecret
this.config.auth.google.callbackUrl
this.config.auth.google.defaultOrganizationId
```

### Email
```typescript
this.config.email.host
this.config.email.port
this.config.email.secure
this.config.email.user
this.config.email.password
this.config.email.from
this.config.email.fromName
this.config.email.testEmail
```

### Cache (Redis)
```typescript
this.config.cache.redis.host
this.config.cache.redis.port
this.config.cache.redis.password
this.config.cache.redis.db
```

### Files (Uploads)
```typescript
this.config.files.uploadPath
this.config.files.uploadsDir
this.config.files.maxFileSize
```

### Security
```typescript
this.config.security.bcrypt.rounds
this.config.security.cors.origins // string[]
this.config.security.throttle.ttl
this.config.security.throttle.limit
```

### Frontend
```typescript
this.config.frontend.url
this.config.frontend.verifyEmailUrl
this.config.frontend.resetPasswordUrl
```

### Swagger
```typescript
this.config.swagger.enabled
this.config.swagger.path
```

### Pagination
```typescript
this.config.pagination.defaultPageSize
this.config.pagination.maxPageSize
```

## Migración desde ConfigService

### Antes
```typescript
import { ConfigService } from '@nestjs/config'

constructor(private readonly configService: ConfigService) {}

const port = parseInt(this.configService.get<string>('PORT', '3000'), 10)
const jwtSecret = this.configService.get<string>('JWT_SECRET')
const nodeEnv = this.configService.get<string>('NODE_ENV')
```

### Después
```typescript
import { AppConfigService } from '@core/config'

constructor(private readonly config: AppConfigService) {}

const port = this.config.app.port
const jwtSecret = this.config.auth.jwt.access.secret
const nodeEnv = this.config.app.nodeEnv
```

## Migración desde process.env

### Antes
```typescript
const port = parseInt(process.env.PORT || '3000', 10)
const isDev = process.env.NODE_ENV === 'development'
const jwtSecret = process.env.JWT_SECRET || 'default-secret'
```

### Después
```typescript
import { AppConfigService } from '@core/config'

constructor(private readonly config: AppConfigService) {}

const port = this.config.app.port
const isDev = this.config.app.isDevelopment
const jwtSecret = this.config.auth.jwt.access.secret
```

## Agregar Nueva Configuración

Si necesitas agregar nuevas variables de entorno:

1. **Agregar a `.env`**
```bash
MY_NEW_VAR=some-value
```

2. **Elegir o crear archivo de config**
```typescript
// src/@core/config/app.config.ts (o el apropiado)
export interface AppConfig {
  // ...existing props
  myNewVar: string // ← Agregar
}

export const appConfig = registerAs('app', (): AppConfig => ({
  // ...existing
  myNewVar: process.env.MY_NEW_VAR || 'default-value', // ← Agregar
}))
```

3. **Usar**
```typescript
const myVar = this.config.app.myNewVar
```

## Ventajas

✅ **Tipado completo**: TypeScript sabe los tipos de cada variable
✅ **Autocompletado**: El IDE te sugiere las propiedades disponibles
✅ **Centralizado**: Una sola fuente de verdad para todas las env vars
✅ **DRY**: No más repetir `configService.get()` en todos lados
✅ **Defaults centralizados**: Todos los valores por defecto en un solo lugar
✅ **Fácil de testear**: Mock `AppConfigService` en vez de múltiples `ConfigService.get()`
✅ **Validación fácil**: Puedes agregar validación de esquema con Joi/Zod en `config.module.ts`

## Notas

- **ConfigService nativo sigue disponible** si lo necesitas para casos especiales
- **process.env NO debe usarse** en el código de la app (solo en config files)
- **Todos los módulos heredan AppConfigService** por ser @Global
- **Variables requeridas sin default**: Considera agregar validación con Joi

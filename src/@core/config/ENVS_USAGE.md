# Sistema de Configuración con Joi (`envs`)

Sistema de configuración **simple, validado y sin boilerplate** usando Joi.

## ✨ Características

✅ **Sin DI (Dependency Injection)** - No más `constructor(private config: AppConfigService)`
✅ **Validación automática con Joi** - Fail-fast si hay errores en `.env`
✅ **100% tipado** - TypeScript autocomplete completo
✅ **Valores por defecto centralizados** - Todo en un solo lugar
✅ **Readonly** - No se puede modificar accidentalmente
✅ **Sin módulos ni servicios** - Solo `import { envs }`

## 🚀 Uso

### Antes (❌ Con boilerplate)

```typescript
import { Injectable } from '@nestjs/common'
import { AppConfigService } from '@core/config'

@Injectable()
export class MyService {
  constructor(private readonly config: AppConfigService) {} // ← Boilerplate

  someMethod() {
    const port = this.config.app.port // ← Requiere `this.config`
    const secret = this.config.auth.jwt.access.secret // ← Anidamiento profundo
    const redisHost = this.config.cache.redis.host
  }
}
```

### Ahora (✅ Sin boilerplate)

```typescript
import { Injectable } from '@nestjs/common'
import { envs } from '@core/config'

@Injectable()
export class MyService {
  // ✨ No constructor necesario!

  someMethod() {
    const port = envs.app.port // ← Directo, sin `this.config`
    const secret = envs.jwt.accessSecret // ← Acceso más corto
    const redisHost = envs.redis.host
  }
}
```

## 📚 Secciones Disponibles

### App (Aplicación)
```typescript
envs.app.nodeEnv          // 'development' | 'production' | 'test' | 'staging'
envs.app.port             // number
envs.app.name             // string
envs.app.url              // string
envs.app.isDevelopment    // boolean
envs.app.isProduction     // boolean
envs.app.isTest           // boolean
```

### Database
```typescript
envs.database.url         // string (DATABASE_URL)
```

### JWT
```typescript
envs.jwt.accessSecret                // string (JWT_SECRET)
envs.jwt.accessExpiresIn             // string (e.g., '15m')
envs.jwt.refreshSecret               // string (JWT_REFRESH_SECRET)
envs.jwt.refreshExpiresIn            // string (e.g., '7d')
envs.jwt.refreshExpirationSeconds    // number (para Redis TTL)
```

### Two-Factor Authentication
```typescript
envs.twoFactor.codeLength                     // number (6)
envs.twoFactor.codeExpiresIn                  // string ('5m')
envs.twoFactor.jwtSecret                      // string
envs.twoFactor.trustedDeviceExpirationDays    // number (90)
envs.twoFactor.trustedDeviceExpirationSeconds // number
envs.twoFactor.resendCooldownSeconds          // number (60)
envs.twoFactor.verifyMaxAttempts              // number (3)
envs.twoFactor.verifyWindowMinutes            // number (10)
```

### Password Reset
```typescript
envs.passwordReset.jwtSecret              // string
envs.passwordReset.tokenExpiresIn         // string ('1h')
envs.passwordReset.maxAttemptsByEmail     // number (10)
envs.passwordReset.windowMinutes          // number (60)
envs.passwordReset.resendCooldownSeconds  // number (60)
```

### Email Verification
```typescript
envs.emailVerification.jwtSecret  // string
```

### Login Rate Limits
```typescript
envs.login.maxAttemptsByIp    // number (10)
envs.login.maxAttemptsByUser  // number (5)
envs.login.windowMinutes      // number (15)
```

### Session
```typescript
envs.session.secret   // string
envs.session.maxAge   // number (en milisegundos)
```

### Device Fingerprint
```typescript
envs.deviceFingerprint.salt  // string
```

### Google OAuth
```typescript
envs.google.clientId                // string
envs.google.clientSecret            // string
envs.google.callbackUrl             // string
envs.google.defaultOrganizationId   // string | null
```

### Email (SMTP)
```typescript
envs.email.host       // string
envs.email.port       // number
envs.email.secure     // boolean
envs.email.user       // string
envs.email.password   // string
envs.email.from       // string
envs.email.fromName   // string
envs.email.testEmail  // string
```

### Redis
```typescript
envs.redis.host      // string
envs.redis.port      // number
envs.redis.password  // string
envs.redis.db        // number
```

### Files (Uploads)
```typescript
envs.files.uploadPath    // string
envs.files.uploadsDir    // string
envs.files.maxFileSize   // number (bytes)
```

### Security
```typescript
envs.security.bcryptRounds    // number (8-15)
envs.security.corsOrigins     // string[] (parsed from CORS_ORIGIN)
envs.security.throttleTtl     // number (ms)
envs.security.throttleLimit   // number
```

### Frontend URLs
```typescript
envs.frontend.url                 // string
envs.frontend.verifyEmailUrl      // string
envs.frontend.resetPasswordUrl    // string
```

### Swagger
```typescript
envs.swagger.enabled  // boolean
envs.swagger.path     // string
```

### Pagination
```typescript
envs.pagination.defaultPageSize  // number (10)
envs.pagination.maxPageSize      // number (100)
```

### Logging
```typescript
envs.log.level  // 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'
```

## 🔧 Variables de Entorno Requeridas

Estas variables **DEBEN** estar en tu `.env` o la app lanzará error al iniciar:

```bash
# ⚠️ OBLIGATORIAS (mínimo 32 caracteres para seguridad)
DATABASE_URL=postgresql://user:pass@localhost:5432/db_name
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters-long
TWO_FACTOR_JWT_SECRET=your-2fa-secret-minimum-32-characters-long
RESET_PASSWORD_JWT_SECRET=your-reset-password-secret-minimum-32-chars
EMAIL_VERIFICATION_JWT_SECRET=your-email-verification-secret-32-chars
SESSION_SECRET=your-session-secret-minimum-32-characters-long
DEVICE_FINGERPRINT_SALT=your-device-salt-minimum-16-chars
```

## ✅ Validación Automática

Al iniciar la app, Joi valida **todas** las variables de entorno:

```typescript
// ✅ Valores correctos
NODE_ENV=production         // ✅ 'development' | 'production' | 'test' | 'staging'
PORT=3000                   // ✅ Number
JWT_SECRET=abc123...        // ✅ Mínimo 32 caracteres
BCRYPT_ROUNDS=12           // ✅ Entre 8 y 15

// ❌ Valores incorrectos
NODE_ENV=invalid            // ❌ Error: must be one of [development, production, test, staging]
PORT=not-a-number          // ❌ Error: must be a number
JWT_SECRET=short           // ❌ Error: must be at least 32 characters
BCRYPT_ROUNDS=20           // ❌ Error: must be less than or equal to 15
JWT_EXPIRES_IN=invalid     // ❌ Error: must match pattern /^\d+[smhd]$/ (e.g., 1h, 5m, 30s)
```

Si hay errores, la app **NO inicia** y muestra todos los errores de validación:

```
Error: ⚠️  Environment variables validation failed:
  - JWT_SECRET is required
  - PORT must be a number
  - NODE_ENV must be one of [development, production, test, staging]
```

## 🎯 Ejemplos Reales

### Controllers
```typescript
import { Controller, Get } from '@nestjs/common'
import { envs } from '@core/config'

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      environment: envs.app.nodeEnv,
      version: '1.0.0',
    }
  }
}
```

### Services
```typescript
import { Injectable } from '@nestjs/common'
import { envs } from '@core/config'

@Injectable()
export class EmailService {
  async sendEmail(to: string, subject: string) {
    const transport = createTransport({
      host: envs.email.host,
      port: envs.email.port,
      secure: envs.email.secure,
      auth: {
        user: envs.email.user,
        pass: envs.email.password,
      },
    })

    await transport.sendMail({
      from: `${envs.email.fromName} <${envs.email.from}>`,
      to,
      subject,
    })
  }
}
```

### Guards / Strategies
```typescript
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
}
```

### Modules (Dynamic Configuration)
```typescript
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { envs } from '@core/config'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: envs.database.url,
      synchronize: envs.app.isDevelopment,
      logging: envs.app.isDevelopment,
    }),
  ],
})
export class DatabaseModule {}
```

### Main.ts
```typescript
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { envs } from '@core/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: envs.security.corsOrigins,
    credentials: true,
  })

  await app.listen(envs.app.port)

  console.log(`🚀 App running on ${envs.app.url}`)
  console.log(`📝 Swagger: ${envs.app.url}/${envs.swagger.path}`)
}

bootstrap()
```

## 🔄 Migración desde `AppConfigService`

### Paso 1: Reemplazar imports
```typescript
// ❌ ANTES
import { AppConfigService } from '@core/config'

// ✅ AHORA
import { envs } from '@core/config'
```

### Paso 2: Remover del constructor
```typescript
// ❌ ANTES
constructor(private readonly config: AppConfigService) {}

// ✅ AHORA
// (sin constructor o sin inyectar config)
```

### Paso 3: Actualizar accesos
```typescript
// ❌ ANTES
this.config.app.port
this.config.auth.jwt.access.secret
this.config.cache.redis.host
this.config.security.cors.origins

// ✅ AHORA
envs.app.port
envs.jwt.accessSecret
envs.redis.host
envs.security.corsOrigins
```

## 📝 Agregar Nuevas Variables

Si necesitas agregar nuevas variables de entorno:

### 1. Agregar al schema Joi en `envs.ts`
```typescript
const envVarsSchema = Joi.object({
  // ...existing
  MY_NEW_VAR: Joi.string().required(),
  MY_OPTIONAL_VAR: Joi.number().default(100),
})
```

### 2. Agregar al objeto exportado
```typescript
export const envs = {
  // ...existing
  myFeature: {
    newVar: validatedEnv.MY_NEW_VAR as string,
    optionalVar: validatedEnv.MY_OPTIONAL_VAR as number,
  },
} as const
```

### 3. Usar
```typescript
import { envs } from '@core/config'

const value = envs.myFeature.newVar
```

## ⚡ Ventajas vs `AppConfigService`

| Aspecto | `AppConfigService` (OLD) | `envs` (NEW) |
|---------|-------------------------|--------------|
| **DI Boilerplate** | `constructor(private config: AppConfigService) {}` | No necesario |
| **Acceso** | `this.config.auth.jwt.access.secret` | `envs.jwt.accessSecret` |
| **Validación** | Manual (o ninguna) | Automática con Joi |
| **Fail-fast** | Errores en runtime | Errores al inicio |
| **Tipado** | Sí | Sí + readonly |
| **Testing** | Mock complejo | Mock simple (objeto) |
| **Performance** | Llamada a método | Acceso directo |

## 🧪 Testing

### Mock simple
```typescript
import { envs } from '@core/config'

// En tests, puedes mockear fácilmente
jest.mock('@core/config', () => ({
  envs: {
    app: { port: 3000, isDevelopment: true },
    jwt: { accessSecret: 'test-secret' },
    // ...
  },
}))
```

## ⚠️ Notas Importantes

1. **Readonly**: El objeto `envs` es readonly (`as const`), no se puede modificar en runtime
2. **Secrets**: Nunca commitees `.env` con secretos reales al repositorio
3. **Mínimo de caracteres**: Los secretos requieren mínimo 32 caracteres por seguridad
4. **Formato de tiempo**: Usa formato `1h`, `5m`, `30s`, `7d` para duraciones
5. **CORS_ORIGIN**: Puede ser múltiple separado por comas: `http://localhost:3000,https://app.com`

## 🎓 Mejores Prácticas

1. **Siempre usa `envs`** en código nuevo
2. **No uses `process.env`** directamente en la app
3. **Valida nuevas variables** con Joi antes de usarlas
4. **Usa valores por defecto** solo para desarrollo/testing
5. **Marca como `.required()`** las variables críticas
6. **Documenta** las nuevas variables en este archivo

## 📊 Estado de Migración

- ✅ Sistema `envs` implementado con Joi
- ⏳ Migración de código existente pendiente
- 🔜 Deprecar `AppConfigService` después de migración completa

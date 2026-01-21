# Guía de Migración al Sistema Centralizado de Configuración

Este documento te guía para migrar el código existente que usa `ConfigService` o `process.env` al nuevo sistema centralizado `AppConfigService`.

## Estado Actual de Migración

### ✅ Archivos ya migrados:
- `src/app.module.ts` - Usa `AppConfigModule`
- `src/@core/http/services/cookie.service.ts` - Usa `AppConfigService`
- `src/modules/auth/google/google-auth.controller.ts` - Usa `AppConfigService`

### 📋 Archivos pendientes de migración:

#### Alta prioridad (usan `ConfigService`):
1. `src/modules/auth/strategies/google.strategy.ts`
2. `src/modules/auth/shared/strategies/jwt.strategy.ts`
3. `src/@core/email/email.module.ts`
4. `src/@core/email/email.service.ts`
5. `src/@core/cache/cache.module.ts`
6. `src/@core/files/services/local-storage.service.ts`
7. `src/@core/database/database.module.ts`
8. `src/@core/security/services/otp-core.service.ts`
9. `src/modules/users/services/email-verification.service.ts`
10. `src/modules/auth/auth.module.ts`

#### Media prioridad (usan `process.env`):
1. `src/modules/auth/login/config/login.config.ts` - **DEPRECAR**, ya está en `auth.config.ts`
2. `src/modules/auth/two-factor/config/two-factor.config.ts` - **DEPRECAR**, ya está en `auth.config.ts`
3. `src/modules/auth/password-reset/config/password-reset.config.ts` - **DEPRECAR**, ya está en `auth.config.ts`
4. `src/modules/auth/trusted-devices/config/trusted-device.config.ts` - **DEPRECAR**, ya está en `auth.config.ts`
5. `src/modules/auth/email-verification/config/email-verification.config.ts` - **DEPRECAR**, ya está en `auth.config.ts`
6. `src/@core/config/database.config.ts` - Ya existe, revisar uso
7. `src/@core/logger/providers/winston.provider.ts`
8. `src/@core/filters/http-exception.filter.ts`
9. `src/main.ts`

#### Baja prioridad (archivos de test):
1. `src/@core/files/verify-setup.ts`
2. `src/@core/files/files.test.ts`
3. `src/@core/email/email.test.ts`
4. `src/@core/files/services/local-storage.service.spec.ts`

## Patrón de Migración

### Antes (ConfigService):
```typescript
import { ConfigService } from '@nestjs/config'

@Injectable()
export class MyService {
  constructor(private readonly configService: ConfigService) {}

  someMethod() {
    const port = parseInt(this.configService.get<string>('PORT', '3000'), 10)
    const jwtSecret = this.configService.get<string>('JWT_SECRET')
    const nodeEnv = this.configService.get<string>('NODE_ENV')
  }
}
```

### Después (AppConfigService):
```typescript
import { AppConfigService } from '@core/config'

@Injectable()
export class MyService {
  constructor(private readonly config: AppConfigService) {}

  someMethod() {
    const port = this.config.app.port
    const jwtSecret = this.config.auth.jwt.access.secret
    const nodeEnv = this.config.app.nodeEnv
  }
}
```

### Antes (process.env en archivos de config):
```typescript
// src/modules/auth/login/config/login.config.ts
export const LOGIN_CONFIG = {
  rateLimit: {
    maxAttemptsByIp: parseInt(process.env.MAX_LOGIN_ATTEMPTS_IP || '10', 10),
  },
}

// Uso en el servicio
import { LOGIN_CONFIG } from './config/login.config'

const maxAttempts = LOGIN_CONFIG.rateLimit.maxAttemptsByIp
```

### Después (usar AppConfigService):
```typescript
// El archivo login.config.ts puede DEPRECARSE
// La configuración ya está en @core/config/auth.config.ts

// Uso en el servicio
import { AppConfigService } from '@core/config'

constructor(private readonly config: AppConfigService) {}

const maxAttempts = this.config.auth.login.rateLimit.maxAttemptsByIp
```

## Instrucciones Paso a Paso

### 1. Para servicios que usan ConfigService:

**Paso 1:** Cambiar el import
```typescript
// Reemplazar
import { ConfigService } from '@nestjs/config'
// Por
import { AppConfigService } from '@core/config'
```

**Paso 2:** Cambiar el constructor
```typescript
// Reemplazar
constructor(private readonly configService: ConfigService) {}
// Por
constructor(private readonly config: AppConfigService) {}
```

**Paso 3:** Reemplazar cada `configService.get()`

Consultar la tabla de mapeo abajo para encontrar el equivalente.

### 2. Para archivos que usan process.env directamente:

**Opción A:** Si es un archivo de configuración en `modules/*/config/`, **deprecarlo** y migrar el código que lo usa a `AppConfigService`.

**Opción B:** Si es código de negocio, inyectar `AppConfigService` y acceder a la configuración desde ahí.

## Tabla de Mapeo de Variables

| Variable ENV | ConfigService.get() | AppConfigService |
|--------------|---------------------|------------------|
| `NODE_ENV` | `configService.get('NODE_ENV')` | `config.app.nodeEnv` |
| `PORT` | `configService.get('PORT')` | `config.app.port` |
| `APP_NAME` | `configService.get('APP_NAME')` | `config.app.name` |
| `APP_URL` | `configService.get('APP_URL')` | `config.app.url` |
| `JWT_SECRET` | `configService.get('JWT_SECRET')` | `config.auth.jwt.access.secret` |
| `JWT_EXPIRES_IN` | `configService.get('JWT_EXPIRES_IN')` | `config.auth.jwt.access.expiresIn` |
| `JWT_REFRESH_SECRET` | `configService.get('JWT_REFRESH_SECRET')` | `config.auth.jwt.refresh.secret` |
| `JWT_REFRESH_EXPIRES_IN` | `configService.get('JWT_REFRESH_EXPIRES_IN')` | `config.auth.jwt.refresh.expiresIn` |
| `TWO_FACTOR_CODE_LENGTH` | `configService.get('TWO_FACTOR_CODE_LENGTH')` | `config.auth.twoFactor.code.length` |
| `TWO_FACTOR_CODE_EXPIRES_IN` | `configService.get('TWO_FACTOR_CODE_EXPIRES_IN')` | `config.auth.twoFactor.code.expiresIn` |
| `TWO_FACTOR_JWT_SECRET` | `configService.get('TWO_FACTOR_JWT_SECRET')` | `config.auth.twoFactor.jwt.secret` |
| `RESET_PASSWORD_JWT_SECRET` | `configService.get('RESET_PASSWORD_JWT_SECRET')` | `config.auth.passwordReset.jwt.secret` |
| `EMAIL_VERIFICATION_JWT_SECRET` | `configService.get('EMAIL_VERIFICATION_JWT_SECRET')` | `config.auth.emailVerification.jwt.secret` |
| `GOOGLE_CLIENT_ID` | `configService.get('GOOGLE_CLIENT_ID')` | `config.auth.google.clientId` |
| `GOOGLE_CLIENT_SECRET` | `configService.get('GOOGLE_CLIENT_SECRET')` | `config.auth.google.clientSecret` |
| `GOOGLE_CALLBACK_URL` | `configService.get('GOOGLE_CALLBACK_URL')` | `config.auth.google.callbackUrl` |
| `MAIL_HOST` | `configService.get('MAIL_HOST')` | `config.email.host` |
| `MAIL_PORT` | `configService.get('MAIL_PORT')` | `config.email.port` |
| `MAIL_USER` | `configService.get('MAIL_USER')` | `config.email.user` |
| `MAIL_PASSWORD` | `configService.get('MAIL_PASSWORD')` | `config.email.password` |
| `MAIL_FROM` | `configService.get('MAIL_FROM')` | `config.email.from` |
| `REDIS_HOST` | `configService.get('REDIS_HOST')` | `config.cache.redis.host` |
| `REDIS_PORT` | `configService.get('REDIS_PORT')` | `config.cache.redis.port` |
| `REDIS_PASSWORD` | `configService.get('REDIS_PASSWORD')` | `config.cache.redis.password` |
| `UPLOAD_PATH` | `configService.get('UPLOAD_PATH')` | `config.files.uploadPath` |
| `MAX_FILE_SIZE` | `configService.get('MAX_FILE_SIZE')` | `config.files.maxFileSize` |
| `BCRYPT_ROUNDS` | `configService.get('BCRYPT_ROUNDS')` | `config.security.bcrypt.rounds` |
| `CORS_ORIGIN` | `configService.get('CORS_ORIGIN')` | `config.security.cors.origins` |
| `THROTTLE_TTL` | `configService.get('THROTTLE_TTL')` | `config.security.throttle.ttl` |
| `THROTTLE_LIMIT` | `configService.get('THROTTLE_LIMIT')` | `config.security.throttle.limit` |
| `FRONTEND_URL` | `configService.get('FRONTEND_URL')` | `config.frontend.url` |
| `FRONTEND_VERIFY_EMAIL_URL` | `configService.get('FRONTEND_VERIFY_EMAIL_URL')` | `config.frontend.verifyEmailUrl` |
| `FRONTEND_RESET_PASSWORD_URL` | `configService.get('FRONTEND_RESET_PASSWORD_URL')` | `config.frontend.resetPasswordUrl` |
| `SWAGGER_ENABLED` | `configService.get('SWAGGER_ENABLED')` | `config.swagger.enabled` |
| `SWAGGER_PATH` | `configService.get('SWAGGER_PATH')` | `config.swagger.path` |
| `DEFAULT_PAGE_SIZE` | `configService.get('DEFAULT_PAGE_SIZE')` | `config.pagination.defaultPageSize` |
| `MAX_PAGE_SIZE` | `configService.get('MAX_PAGE_SIZE')` | `config.pagination.maxPageSize` |

## Ejemplo Completo: Migrar Google Strategy

### Antes:
```typescript
// src/modules/auth/strategies/google.strategy.ts
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    })
  }
}
```

### Después:
```typescript
// src/modules/auth/strategies/google.strategy.ts
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20'
import { Injectable } from '@nestjs/common'
import { AppConfigService } from '@core/config'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: AppConfigService) {
    super({
      clientID: config.auth.google.clientId,
      clientSecret: config.auth.google.clientSecret,
      callbackURL: config.auth.google.callbackUrl,
      scope: ['email', 'profile'],
    })
  }
}
```

## Archivos a Deprecar

Estos archivos de configuración **pueden eliminarse** una vez migrados todos los usos:

```bash
# Archivos con configuración duplicada (ya migrada a @core/config/auth.config.ts)
src/modules/auth/login/config/login.config.ts
src/modules/auth/two-factor/config/two-factor.config.ts
src/modules/auth/password-reset/config/password-reset.config.ts
src/modules/auth/trusted-devices/config/trusted-device.config.ts
src/modules/auth/email-verification/config/email-verification.config.ts
```

## Verificación Post-Migración

Después de migrar cada archivo:

1. **Compilar:**
   ```bash
   npm run build
   ```

2. **Buscar usos restantes de ConfigService:**
   ```bash
   grep -r "ConfigService" src/path/to/migrated/file
   ```

3. **Buscar usos de process.env:**
   ```bash
   grep -r "process.env" src/path/to/migrated/file
   ```

4. **Ejecutar tests:**
   ```bash
   npm test
   ```

## Beneficios Post-Migración

Una vez completada la migración:

✅ **Una sola fuente de verdad** - Todas las env vars en `@core/config`
✅ **Tipado completo** - TypeScript detecta errores de configuración
✅ **Autocompletado** - El IDE sugiere propiedades disponibles
✅ **Refactoring seguro** - Renombrar propiedades actualiza todos los usos
✅ **Testing más fácil** - Mock `AppConfigService` en vez de múltiples `ConfigService.get()`
✅ **Validación centralizada** - Puedes agregar validación con Joi en un solo lugar
✅ **Documentación viva** - Los tipos sirven como documentación

## Soporte

Si tienes dudas durante la migración, consulta:
- `/src/@core/config/README.md` - Documentación completa del sistema
- Ejemplos ya migrados: `CookieService`, `GoogleAuthController`

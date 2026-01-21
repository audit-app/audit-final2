import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { AppConfig } from './app.config'
import type { AuthConfig } from './auth.config'
import type { EmailConfig } from './email.config'
import type { CacheConfig } from './cache.config'
import type { FilesConfig } from './files.config'
import type { SecurityConfig } from './security.config'
import type { FrontendConfig } from './frontend.config'
import type { SwaggerConfig } from './swagger.config'
import type { PaginationConfig } from './pagination.config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'

/**
 * Servicio centralizado de configuración
 *
 * Proporciona acceso tipado y fácil a todas las variables de entorno de la aplicación.
 * Elimina la necesidad de inyectar ConfigService y usar .get() en todos lados.
 *
 * @example
 * ```typescript
 * constructor(private readonly config: AppConfigService) {}
 *
 * // Acceso directo y tipado
 * const port = this.config.app.port
 * const jwtSecret = this.config.auth.jwt.access.secret
 * const redisHost = this.config.cache.redis.host
 * ```
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Configuración general de la aplicación
   */
  get app(): AppConfig {
    return this.configService.get<AppConfig>('app')!
  }

  /**
   * Configuración de autenticación (JWT, 2FA, Password Reset, etc.)
   */
  get auth(): AuthConfig {
    return this.configService.get<AuthConfig>('auth')!
  }

  /**
   * Configuración de email (SMTP)
   */
  get email(): EmailConfig {
    return this.configService.get<EmailConfig>('email')!
  }

  /**
   * Configuración de cache (Redis)
   */
  get cache(): CacheConfig {
    return this.configService.get<CacheConfig>('cache')!
  }

  /**
   * Configuración de archivos (uploads)
   */
  get files(): FilesConfig {
    return this.configService.get<FilesConfig>('files')!
  }

  /**
   * Configuración de seguridad (bcrypt, CORS, throttle)
   */
  get security(): SecurityConfig {
    return this.configService.get<SecurityConfig>('security')!
  }

  /**
   * URLs del frontend
   */
  get frontend(): FrontendConfig {
    return this.configService.get<FrontendConfig>('frontend')!
  }

  /**
   * Configuración de Swagger
   */
  get swagger(): SwaggerConfig {
    return this.configService.get<SwaggerConfig>('swagger')!
  }

  /**
   * Configuración de paginación
   */
  get pagination(): PaginationConfig {
    return this.configService.get<PaginationConfig>('pagination')!
  }

  /**
   * Configuración de base de datos
   * Nota: Usa la configuración de TypeORM directamente desde ConfigModule
   */
  get database(): TypeOrmModuleOptions {
    return this.configService.get('database')!
  }
}

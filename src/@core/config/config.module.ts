import { Global, Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import { AppConfigService } from './config.service'
import { appConfig } from './app.config'
import { authConfig } from './auth.config'
import { emailConfig } from './email.config'
import { cacheConfig } from './cache.config'
import { filesConfig } from './files.config'
import { securityConfig } from './security.config'
import { frontendConfig } from './frontend.config'
import { swaggerConfig } from './swagger.config'
import { paginationConfig } from './pagination.config'
import { databaseConfig } from './database.config'

/**
 * Módulo global de configuración
 *
 * Proporciona AppConfigService que da acceso tipado a todas las variables de entorno.
 * Este módulo es @Global, por lo que AppConfigService está disponible en toda la aplicación
 * sin necesidad de importarlo explícitamente.
 *
 * @example
 * ```typescript
 * // En cualquier servicio o controlador
 * constructor(private readonly config: AppConfigService) {}
 *
 * someMethod() {
 *   const port = this.config.app.port
 *   const jwtSecret = this.config.auth.jwt.access.secret
 * }
 * ```
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        appConfig,
        authConfig,
        emailConfig,
        cacheConfig,
        filesConfig,
        securityConfig,
        frontendConfig,
        swaggerConfig,
        paginationConfig,
        databaseConfig,
      ],
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}

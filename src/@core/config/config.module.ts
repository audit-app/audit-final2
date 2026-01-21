import { Global, Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'

/**
 * Módulo global de configuración
 *
 * DEPRECADO: Este módulo solo existe por compatibilidad legacy.
 * Se recomienda usar directamente el objeto `envs` de @core/config
 *
 * @deprecated Use `envs` from '@core/config' instead
 *
 * @example
 * ```typescript
 * // ✅ Recomendado (nuevo)
 * import { envs } from '@core/config'
 * const port = envs.app.port
 * const jwtSecret = envs.jwt.accessSecret
 *
 * // ❌ Legacy (evitar)
 * constructor(private readonly config: AppConfigService) {}
 * ```
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
})
export class AppConfigModule {}

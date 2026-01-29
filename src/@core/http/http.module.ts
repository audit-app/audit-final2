import { Global, Module } from '@nestjs/common'
import { CookieService } from './services/cookie.service'
import { ConnectionMetadataService } from './services/connection-metadata.service'

/**
 * Módulo global HTTP
 *
 * Proporciona servicios HTTP reutilizables en toda la aplicación:
 * - CookieService: Manejo centralizado de cookies HTTP-only
 * - ConnectionMetadataService: Procesamiento de metadata de conexión (IP, User-Agent, fingerprints)
 *
 * Incluye decoradores:
 * - @ConnectionInfo: Extrae información de conexión HTTP del request
 *
 * Este módulo es @Global, por lo que sus servicios están
 * disponibles sin necesidad de importarlo explícitamente
 */
@Global()
@Module({
  providers: [CookieService, ConnectionMetadataService],
  exports: [CookieService, ConnectionMetadataService],
})
export class HttpModule {}

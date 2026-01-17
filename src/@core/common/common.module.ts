import { Module, Global } from '@nestjs/common'
import { ConnectionMetadataService } from './services'

/**
 * Módulo común con utilidades compartidas
 *
 * Contiene:
 * - Decoradores (@ConnectionInfo)
 * - Servicios de utilidad (ConnectionMetadataService)
 * - Interfaces compartidas
 *
 * Es un módulo global para que esté disponible en toda la aplicación
 */
@Global()
@Module({
  providers: [ConnectionMetadataService],
  exports: [ConnectionMetadataService],
})
export class CommonModule {}

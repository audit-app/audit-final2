import { Injectable } from '@nestjs/common'
import { TemplateExportService } from '../../services'

/**
 * Export Template Use Case
 *
 * Exporta una plantilla completa (con todos sus standards) a Excel
 *
 * Casos de uso:
 * - Backup de plantillas
 * - Compartir plantillas entre entornos (dev, staging, prod)
 * - Generar datos de prueba para desarrollo
 * - Documentación offline de plantillas
 *
 * @example
 * const buffer = await exportTemplateUseCase.execute('template-id')
 * // El buffer puede ser enviado como respuesta HTTP para descarga
 */
@Injectable()
export class ExportTemplateUseCase {
  constructor(private readonly templateExportService: TemplateExportService) {}

  /**
   * Ejecuta la exportación de la plantilla
   *
   * @param templateId - ID de la plantilla a exportar
   * @returns Buffer del archivo Excel
   * @throws {TemplateNotFoundException} Si la plantilla no existe
   */
  async execute(templateId: string): Promise<Buffer> {
    return await this.templateExportService.exportTemplate(templateId)
  }
}

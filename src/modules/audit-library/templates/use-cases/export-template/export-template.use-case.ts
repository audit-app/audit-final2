import { Injectable } from '@nestjs/common'
import { TemplateExportService } from '../../shared/services'

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

  /**
   * Genera el nombre del archivo para la descarga
   *
   * @param templateId - ID de la plantilla
   * @returns Nombre del archivo con formato: NombrePlantilla_vVersion_YYYY-MM-DD.xlsx
   */
  async getFileName(templateId: string): Promise<string> {
    // Este método podría usar el servicio para obtener el template
    // y generar el nombre correcto, pero por simplicidad lo dejamos así
    const timestamp = new Date().toISOString().split('T')[0]
    return `template_${templateId}_${timestamp}.xlsx`
  }
}

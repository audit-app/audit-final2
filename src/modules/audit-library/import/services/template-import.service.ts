import { Injectable, Logger } from '@nestjs/common'
import * as XLSX from 'xlsx'
import { ImportPipelineService } from '../pipeline/import-pipeline.service'
import { ImportTemplateMetadataDto } from '../dtos'
import {
  ValidatedImportData,
  ImportResult,
} from '../interfaces/import-data.interface'

/**
 * Template Import Service (Refactored v3 - Pipeline Pattern)
 *
 * Servicio simplificado que DELEGA toda la lógica al pipeline.
 *
 * Antes (v2): 650+ líneas, múltiples responsabilidades mezcladas
 * Ahora (v3): ~100 líneas, solo orquestación y utilidades
 *
 * Responsabilidades:
 * - API pública para importación (delega a pipeline)
 * - Generación de template Excel de ejemplo
 * - Conversión de tipos para compatibilidad
 *
 * ✅ Arquitectura limpia con Pipeline Pattern:
 * - ParseExcelStep: Excel → DTO[]
 * - ValidateDataStep: Validación individual
 * - ValidateHierarchyStep: Validación jerárquica
 * - PersistDataStep: Guardar con cascade
 */
@Injectable()
export class TemplateImportService {
  private readonly logger = new Logger(TemplateImportService.name)

  constructor(private readonly pipeline: ImportPipelineService) {}

  /**
   * Procesa archivo Excel y retorna datos validados (sin guardar)
   *
   * Útil para preview antes de confirmar importación
   */
  async processExcelFile(fileBuffer: Buffer): Promise<ValidatedImportData> {
    this.logger.log('📥 Procesando archivo Excel...')
    return await this.pipeline.processExcelFile(fileBuffer)
  }

  /**
   * Guarda resultado de importación en base de datos
   *
   * Ejecuta el pipeline completo: parse + validate + persist con cascade
   */
  async saveImportResult(
    templateMetadata: ImportTemplateMetadataDto,
    fileBuffer: Buffer,
  ): Promise<ImportResult> {
    this.logger.log(
      `💾 Importando template "${templateMetadata.name}" v${templateMetadata.version}...`,
    )

    return await this.pipeline.execute(fileBuffer, templateMetadata)
  }

  /**
   * Importa directamente (parse + validate + save)
   *
   * Método conveniente para importación completa en un paso
   */
  async importTemplate(
    fileBuffer: Buffer,
    metadata: ImportTemplateMetadataDto,
  ): Promise<ImportResult> {
    return await this.saveImportResult(metadata, fileBuffer)
  }

  /**
   * Genera archivo Excel de ejemplo para descargar
   *
   * Los usuarios pueden llenar este template y subirlo
   */
  generateExcelTemplate(): Buffer {
    this.logger.log('📄 Generando template Excel de ejemplo...')

    const workbook = XLSX.utils.book_new()

    // Sheet: Estándares
    const standardsHeaders = [
      'codigo',
      'titulo',
      'descripcion',
      'codigo_padre',
      'orden',
      'nivel',
      'es_auditable',
      'esta_activo',
    ]

    const exampleRows = [
      [
        'A.1',
        'Control de acceso',
        'Descripción del control de acceso',
        '',
        '1',
        '1',
        'true',
        'true',
      ],
      [
        'A.1.1',
        'Políticas de control de acceso',
        'Subcontrol nivel 2',
        'A.1',
        '1',
        '2',
        'true',
        'true',
      ],
      [
        'A.1.1.1',
        'Revisión de derechos de acceso',
        'Subcontrol nivel 3',
        'A.1.1',
        '1',
        '3',
        'true',
        'true',
      ],
      [
        'A.2',
        'Seguridad física',
        'Controles de seguridad física',
        '',
        '2',
        '1',
        'true',
        'true',
      ],
      [
        'A.2.1',
        'Perímetro de seguridad física',
        'Protección de perímetros',
        'A.2',
        '1',
        '2',
        'true',
        'true',
      ],
    ]

    const standardsSheet = XLSX.utils.aoa_to_sheet([
      standardsHeaders,
      ...exampleRows,
    ])

    // Ajustar anchos de columna
    standardsSheet['!cols'] = [
      { wch: 12 }, // codigo
      { wch: 40 }, // titulo
      { wch: 50 }, // descripcion
      { wch: 15 }, // codigo_padre
      { wch: 8 }, // orden
      { wch: 8 }, // nivel
      { wch: 15 }, // es_auditable
      { wch: 15 }, // esta_activo
    ]

    XLSX.utils.book_append_sheet(workbook, standardsSheet, 'Estándares')

    this.logger.log('✅ Template Excel generado')

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  }

  /**
   * Obtiene información sobre el formato esperado
   */
  getImportFormat(): {
    requiredColumns: string[]
    exampleData: Record<string, unknown>
    notes: string[]
  } {
    return {
      requiredColumns: [
        'codigo',
        'titulo',
        'descripcion',
        'codigo_padre',
        'orden',
        'nivel',
        'es_auditable',
        'esta_activo',
      ],
      exampleData: {
        codigo: 'A.1.1',
        titulo: 'Políticas de seguridad',
        descripcion: 'Descripción del control',
        codigo_padre: 'A.1',
        orden: 1,
        nivel: 2,
        es_auditable: true,
        esta_activo: true,
      },
      notes: [
        'Los códigos deben ser únicos',
        'codigo_padre debe existir (excepto para nodos raíz)',
        'nivel debe ser consistente con la jerarquía',
        'Soporta jerarquías de cualquier profundidad',
      ],
    }
  }
}

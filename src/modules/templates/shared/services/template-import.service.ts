import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import {
  validate,
  ValidationError as ClassValidatorError,
} from 'class-validator'
import { plainToInstance } from 'class-transformer'
import * as XLSX from 'xlsx'
import { ImportTemplateMetadataDto } from '../../dtos'
import { ImportStandardDto } from '../../../standards/dtos'
import { TemplatesRepository } from '../../repositories/templates.repository'
import { StandardsRepository } from '../../../standards/repositories/standards.repository'
import { TransactionService } from '@core/database'
import { HierarchyValidatorUtil, HierarchyProcessorUtil } from '../utils'

/**
 * ✅ Template Import Service (Refactored v2)
 *
 * Servicio de importación de templates con validación robusta:
 * - Soporta Excel (.xlsx)
 * - Validación en 3 fases: estructura, datos individuales, jerarquía
 * - Jerarquías multi-nivel (sin límite de profundidad)
 * - Mensajes de error claros con número de fila
 *
 * Arquitectura:
 * - Template metadata → Form fields (name, description, version)
 * - Standards → Excel file con columnas:
 *   código, título, descripción, código_padre, orden, nivel, es_auditable, esta_activo
 */

/**
 * Validation error for a specific row/field
 */
export interface ValidationError {
  row: number
  field: string
  value: unknown
  message: string
}

/**
 * Result of processing a single sheet/file
 */
interface SheetResult<T extends object = object> {
  sheetName: string
  validData: T[]
  errors: ValidationError[]
  totalRows: number
}

/**
 * Final import result with all validation errors
 */
export interface ImportResult {
  success: boolean
  standards: {
    data: ImportStandardDto[]
    errors: ValidationError[]
    totalRows: number
  }
  crossValidationErrors: ValidationError[]
  summary: {
    totalRows: number
    totalValidRows: number
    totalErrors: number
    hierarchyDepth: number
  }
}

@Injectable()
export class TemplateImportService {
  private readonly logger = new Logger(TemplateImportService.name)

  constructor(
    private readonly templatesRepository: TemplatesRepository,
    private readonly standardsRepository: StandardsRepository,
    private readonly transactionService: TransactionService,
  ) {}

  // ========================================
  // Public API
  // ========================================

  /**
   * Process Excel file (.xlsx)
   *
   * @param fileBuffer - Excel file buffer
   * @returns Import result with validation errors
   */
  async processExcelFile(fileBuffer: Buffer): Promise<ImportResult> {
    try {
      this.logger.log('📥 Iniciando procesamiento de archivo Excel')

      const workbook = XLSX.read(fileBuffer, {
        type: 'buffer',
        cellDates: true,
      })

      const standardsResult = await this.processStandardsSheet(workbook)
      const crossValidationErrors = this.performCrossValidation(
        standardsResult.validData,
      )

      const importResult = this.createImportResult(
        standardsResult,
        crossValidationErrors,
      )

      this.logger.log(
        `✅ Procesamiento Excel completado. Éxito: ${importResult.success}, ` +
          `Válidos: ${importResult.summary.totalValidRows}/${importResult.summary.totalRows}`,
      )

      return importResult
    } catch (error) {
      const errorStack = error instanceof Error ? error.stack : String(error)
      this.logger.error('❌ Error procesando archivo Excel', errorStack)
      throw new BadRequestException(
        'Error procesando archivo Excel. Verifique que el formato sea válido.',
      )
    }
  }

  /**
   * Save validated import result to database
   *
   * ⚠️ IMPROVED: Soporta jerarquías multi-nivel
   *
   * Algoritmo:
   * 1. Crear template
   * 2. Ordenar standards por nivel (nivel 1, 2, 3, etc.)
   * 3. Procesar en orden, manteniendo mapa code -> id
   * 4. Cada standard resuelve su parentId del mapa
   *
   * @param templateMetadata - Template metadata from form
   * @param importResult - Validated import result
   * @returns Created template and standards count
   */
  async saveImportResult(
    templateMetadata: ImportTemplateMetadataDto,
    importResult: ImportResult,
  ): Promise<{
    templateId: string
    standardsCount: number
  }> {
    if (!importResult.success) {
      throw new BadRequestException(
        'No se puede guardar. El resultado contiene errores de validación.',
      )
    }

    return await this.transactionService.runInTransaction(async () => {
      // Phase 1: Create Template
      this.logger.log('📝 Creando template...')
      const savedTemplate = await this.templatesRepository.save({
        name: templateMetadata.name,
        description: templateMetadata.description,
        version: templateMetadata.version,
      })

      this.logger.log(`✅ Template creado: ${savedTemplate.id}`)

      // Phase 2: Sort standards by hierarchy level (parents before children)
      const sortedStandards = HierarchyProcessorUtil.sortByHierarchy(
        importResult.standards.data,
      )

      // Log hierarchy statistics
      const stats = HierarchyProcessorUtil.getHierarchyStats(sortedStandards)
      this.logger.log(
        `📊 Jerarquía: ${stats.totalStandards} estándares, ` +
          `${stats.maxLevel} niveles, ${stats.rootCount} raíces`,
      )

      // Phase 3: Process standards level by level
      const codeToIdMap = new Map<string, string>()

      for (const standardData of sortedStandards) {
        // Resolve parent ID from code (using map built so far)
        const parentId = HierarchyProcessorUtil.resolveParentId(
          standardData.parentCode,
          codeToIdMap,
        )

        // Save standard
        const savedStandard = await this.standardsRepository.save({
          code: standardData.code,
          title: standardData.title,
          description: standardData.description,
          order: standardData.order,
          level: standardData.level,
          isAuditable: standardData.isAuditable ?? true,
          isActive: standardData.isActive ?? true,
          templateId: savedTemplate.id,
          parentId,
        })

        // Add to map for children to reference
        codeToIdMap.set(standardData.code, savedStandard.id)
      }

      this.logger.log(
        `✅ ${sortedStandards.length} estándares creados exitosamente`,
      )

      return {
        templateId: savedTemplate.id,
        standardsCount: sortedStandards.length,
      }
    })
  }

  /**
   * Generate Excel template file for users to fill
   *
   * @returns Excel file buffer
   */
  generateExcelTemplate(): Buffer {
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
        'Descripción del control',
        '',
        '1',
        '1',
        'true',
        'true',
      ],
      [
        'A.1.1',
        'Subcontrol nivel 2',
        'Descripción del subcontrol',
        'A.1',
        '1',
        '2',
        'true',
        'true',
      ],
      [
        'A.1.1.1',
        'Subcontrol nivel 3',
        'Nivel más profundo',
        'A.1.1',
        '1',
        '3',
        'true',
        'true',
      ],
    ]

    const standardsSheet = XLSX.utils.aoa_to_sheet([
      standardsHeaders,
      ...exampleRows,
    ])
    XLSX.utils.book_append_sheet(workbook, standardsSheet, 'Estándares')

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  }

  // ========================================
  // Private Methods - Excel Processing
  // ========================================

  /**
   * Process "Estándares" sheet from Excel workbook
   */
  private async processStandardsSheet(
    workbook: XLSX.WorkBook,
  ): Promise<SheetResult<ImportStandardDto>> {
    const sheetName = 'Estándares'

    // Validate sheet exists
    if (!workbook.SheetNames.includes(sheetName)) {
      return {
        sheetName,
        validData: [],
        errors: [
          {
            row: 0,
            field: 'sheet',
            value: sheetName,
            message: `Hoja "${sheetName}" no encontrada en el archivo. Hojas disponibles: ${workbook.SheetNames.join(', ')}`,
          },
        ],
        totalRows: 0,
      }
    }

    const worksheet = workbook.Sheets[sheetName]
    const rawData = this.extractRawData(worksheet)

    // Validate has data
    if (rawData.length < 2) {
      return {
        sheetName,
        validData: [],
        errors: [
          {
            row: 0,
            field: 'sheet',
            value: sheetName,
            message:
              'Hoja vacía o sin datos. Debe tener al menos encabezados y una fila de datos.',
          },
        ],
        totalRows: 0,
      }
    }

    const [headers, ...dataRows] = rawData

    // Validate headers
    const headerMapping = this.createHeaderMapping(
      headers,
      this.getStandardsFieldMapping(),
    )

    if (!headerMapping) {
      return {
        sheetName,
        validData: [],
        errors: [
          {
            row: 1,
            field: 'headers',
            value: headers.join(', '),
            message:
              'Columnas incorrectas. Columnas requeridas: ' +
              'codigo, titulo, descripcion, codigo_padre, orden, nivel, es_auditable, esta_activo',
          },
        ],
        totalRows: dataRows.length,
      }
    }

    // Process data rows
    return await this.processDataRows(
      sheetName,
      dataRows,
      headerMapping,
      ImportStandardDto,
    )
  }

  // ========================================
  // Private Methods - Common Utilities
  // ========================================

  /**
   * Get field mapping for standards
   */
  private getStandardsFieldMapping(): Record<string, string> {
    return {
      codigo: 'code',
      titulo: 'title',
      descripcion: 'description',
      codigo_padre: 'parentCode',
      orden: 'order',
      nivel: 'level',
      es_auditable: 'isAuditable',
      esta_activo: 'isActive',
    }
  }

  /**
   * Extract raw data from Excel worksheet
   */
  private extractRawData(worksheet: XLSX.WorkSheet): string[][] {
    const data = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    })

    // Filter out completely empty rows
    return data.filter((row) =>
      row.some((cell) => cell && cell.toString().trim() !== ''),
    )
  }

  /**
   * Create header mapping from CSV/Excel headers to DTO field names
   *
   * @param headers - Headers from file
   * @param mapping - Expected mapping (Spanish -> English)
   * @returns Header mapping (column index -> field name) or null if invalid
   */
  private createHeaderMapping(
    headers: string[],
    mapping: Record<string, string>,
  ): Record<number, string> | null {
    const normalizedHeaders = headers.map((h) => this.normalizeString(h))
    const requiredColumns = Object.keys(mapping)

    // Check all required columns exist
    const missingColumns = requiredColumns.filter(
      (required) => !normalizedHeaders.includes(required),
    )

    if (missingColumns.length > 0) {
      this.logger.warn(
        `Columnas faltantes: ${missingColumns.join(', ')}. ` +
          `Encontradas: ${normalizedHeaders.join(', ')}`,
      )
      return null
    }

    // Build mapping
    const headerMapping: Record<number, string> = {}
    headers.forEach((header, index) => {
      const normalized = this.normalizeString(header)
      const mappedField = mapping[normalized]
      if (mappedField) {
        headerMapping[index] = mappedField
      }
    })

    return headerMapping
  }

  /**
   * Process data rows and validate each
   */
  private async processDataRows<T extends object>(
    sheetName: string,
    dataRows: string[][],
    headerMapping: Record<number, string>,
    DtoClass: new () => T,
  ): Promise<SheetResult<T>> {
    const validData: T[] = []
    const errors: ValidationError[] = []

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const rowIndex = i + 2 // +2 because: 0-based index + 1 for header row + 1 for Excel 1-based

      // Map row to object
      const rowObject = this.mapRowToObject(row, headerMapping)

      // Validate row object
      const rowErrors = await this.validateRowObject(
        rowObject,
        DtoClass,
        rowIndex,
      )

      if (rowErrors.length === 0) {
        validData.push(rowObject as T)
      } else {
        errors.push(...rowErrors)
      }
    }

    return {
      sheetName,
      validData,
      errors,
      totalRows: dataRows.length,
    }
  }

  /**
   * Map row array to object using header mapping
   *
   * ⚠️ IMPROVED: No omite campos vacíos para que class-validator los detecte
   */
  private mapRowToObject(
    row: string[],
    headerMapping: Record<number, string>,
  ): Record<string, unknown> {
    const obj: Record<string, unknown> = {}

    Object.entries(headerMapping).forEach(([indexStr, fieldName]) => {
      const index = parseInt(indexStr)
      const value = row[index]

      // IMPORTANTE: Siempre asignar el campo, incluso si está vacío
      // Esto permite que @IsNotEmpty() funcione correctamente
      if (value !== undefined && value !== null) {
        const trimmedValue = value.toString().trim()
        // Convertir cadenas vacías a undefined para activar @IsOptional()
        obj[fieldName] =
          trimmedValue === '' ? undefined : this.convertValue(trimmedValue)
      } else {
        obj[fieldName] = undefined
      }
    })

    return obj
  }

  /**
   * Convert string value to appropriate type
   */
  private convertValue(value: string): string | number | boolean {
    // Boolean
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false

    // Integer
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10)
    }

    // Float
    if (/^\d*\.\d+$/.test(value)) {
      return parseFloat(value)
    }

    // String
    return value
  }

  /**
   * Validate row object using class-validator
   */
  private async validateRowObject<T extends object>(
    rowData: Record<string, unknown>,
    DtoClass: new () => T,
    rowIndex: number,
  ): Promise<ValidationError[]> {
    try {
      const instance = plainToInstance(DtoClass, rowData, {
        enableImplicitConversion: true,
      })

      const validationErrors = await validate(instance as object)
      return this.mapValidationErrors(validationErrors, rowIndex)
    } catch (error) {
      return [
        {
          row: rowIndex,
          field: 'general',
          value: JSON.stringify(rowData),
          message: `Error procesando fila: ${(error as Error).message}`,
        },
      ]
    }
  }

  /**
   * Map class-validator errors to our ValidationError format
   */
  private mapValidationErrors(
    validationErrors: ClassValidatorError[],
    rowIndex: number,
  ): ValidationError[] {
    const errors: ValidationError[] = []

    validationErrors.forEach((error) => {
      const constraints = error.constraints || {}
      Object.entries(constraints).forEach(([, message]) => {
        errors.push({
          row: rowIndex,
          field: error.property,
          value: error.value,
          message,
        })
      })
    })

    return errors
  }

  /**
   * Perform cross-validation (hierarchy validation)
   *
   * ⚠️ IMPROVED: Usa HierarchyValidatorUtil
   */
  private performCrossValidation(
    standards: ImportStandardDto[],
  ): ValidationError[] {
    const hierarchyErrors = HierarchyValidatorUtil.validate(standards)

    // Convert HierarchyValidationError to ValidationError
    return hierarchyErrors.map((err) => ({
      row: err.row,
      field: err.field,
      value: err.value,
      message: err.message,
    }))
  }

  /**
   * Normalize string for header comparison
   */
  private normalizeString(text: string): string {
    if (!text || typeof text !== 'string') return ''

    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9_]/g, '')
  }

  /**
   * Create final import result
   */
  private createImportResult(
    standardsResult: SheetResult<ImportStandardDto>,
    crossValidationErrors: ValidationError[],
  ): ImportResult {
    const stats = HierarchyProcessorUtil.getHierarchyStats(
      standardsResult.validData,
    )

    const importResult: ImportResult = {
      success: false,
      standards: {
        data: standardsResult.validData,
        errors: standardsResult.errors,
        totalRows: standardsResult.totalRows,
      },
      crossValidationErrors,
      summary: {
        totalRows: standardsResult.totalRows,
        totalValidRows: standardsResult.validData.length,
        totalErrors:
          standardsResult.errors.length + crossValidationErrors.length,
        hierarchyDepth: stats.maxLevel,
      },
    }

    importResult.success = importResult.summary.totalErrors === 0

    return importResult
  }
}

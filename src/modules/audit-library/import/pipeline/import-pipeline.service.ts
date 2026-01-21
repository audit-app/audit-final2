import { Injectable, Logger } from '@nestjs/common'
import {
  ParseExcelStep,
  ValidateDataStep,
  ValidateHierarchyStep,
  PersistDataStep,
} from './steps'
import { HierarchyProcessorUtil } from '../utils'
import {
  ValidatedImportData,
  ImportResult,
} from '../interfaces/import-data.interface'
import { ImportTemplateMetadataDto } from '../dtos'

/**
 * Import Pipeline Service
 *
 * Orquestador que ejecuta los steps en orden:
 * 1. ParseExcelStep: Excel → DTO[]
 * 2. ValidateDataStep: DTO[] → Validated DTO[]
 * 3. ValidateHierarchyStep: Check jerarquía
 * 4. PersistDataStep: Build tree + Save con cascade
 *
 * Beneficios del patrón Pipeline:
 * - ✅ Cada step tiene UNA responsabilidad (SRP)
 * - ✅ Fácil de testear (test cada step independiente)
 * - ✅ Fácil de extender (agregar nuevos steps)
 * - ✅ Flujo de datos claro y predecible
 */
@Injectable()
export class ImportPipelineService {
  private readonly logger = new Logger(ImportPipelineService.name)

  constructor(
    private readonly parseExcelStep: ParseExcelStep,
    private readonly validateDataStep: ValidateDataStep,
    private readonly validateHierarchyStep: ValidateHierarchyStep,
    private readonly persistDataStep: PersistDataStep,
  ) {}

  /**
   * Ejecuta el pipeline completo de importación
   *
   * @param fileBuffer - Buffer del archivo Excel
   * @param metadata - Metadatos del template (nombre, versión, etc.)
   * @returns Resultado de la importación
   */
  async execute(
    fileBuffer: Buffer,
    metadata: ImportTemplateMetadataDto,
  ): Promise<ImportResult> {
    try {
      this.logger.log('🚀 Iniciando pipeline de importación...')

      // Step 1: Parse Excel
      const parsedData = await this.parseExcelStep.execute(fileBuffer)

      if (parsedData.errors.length > 0 && parsedData.standards.length === 0) {
        // Error crítico de parseo
        return {
          success: false,
          errors: parsedData.errors,
          message: 'Error parseando archivo Excel',
        }
      }

      // Step 2: Validate individual data
      const validatedData = await this.validateDataStep.execute(parsedData)

      if (validatedData.standards.length === 0) {
        return {
          success: false,
          errors: validatedData.errors,
          message: 'No hay datos válidos para importar',
        }
      }

      // Step 3: Validate hierarchy
      const hierarchyErrors = this.validateHierarchyStep.execute(validatedData)

      // Step 4: Create validated import data
      const importData = this.createValidatedImportData(
        metadata,
        validatedData,
        hierarchyErrors,
      )

      if (!importData.success) {
        return {
          success: false,
          errors: [...importData.errors, ...importData.crossValidationErrors],
          message: `Se encontraron ${importData.summary.totalErrors} errores de validación`,
        }
      }

      // Step 5: Persist with cascade
      const result = await this.persistDataStep.execute(importData)

      this.logger.log(
        result.success
          ? `✅ Pipeline completado exitosamente`
          : `❌ Pipeline falló: ${result.message}`,
      )

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`❌ Error en pipeline: ${errorMessage}`)

      return {
        success: false,
        message: `Error en pipeline de importación: ${errorMessage}`,
      }
    }
  }

  /**
   * Procesa solo el Excel sin guardar (para preview)
   */
  async processExcelFile(fileBuffer: Buffer): Promise<ValidatedImportData> {
    // Step 1: Parse
    const parsedData = await this.parseExcelStep.execute(fileBuffer)

    // Step 2: Validate data
    const validatedData = await this.validateDataStep.execute(parsedData)

    // Step 3: Validate hierarchy
    const hierarchyErrors = this.validateHierarchyStep.execute(validatedData)

    // Return validation result (without metadata since it's just preview)
    return this.createValidatedImportData(
      { name: '', version: '' } as ImportTemplateMetadataDto, // Placeholder
      validatedData,
      hierarchyErrors,
    )
  }

  /**
   * Crea objeto de datos validados con resumen
   */
  private createValidatedImportData(
    metadata: ImportTemplateMetadataDto,
    validatedData: any,
    hierarchyErrors: any[],
  ): ValidatedImportData {
    const stats = HierarchyProcessorUtil.getHierarchyStats(
      validatedData.standards,
    )

    const totalErrors = validatedData.errors.length + hierarchyErrors.length

    return {
      metadata,
      standards: validatedData.standards,
      errors: validatedData.errors,
      crossValidationErrors: hierarchyErrors,
      summary: {
        totalRows: validatedData.totalRows,
        totalValidRows: validatedData.standards.length,
        totalErrors,
        hierarchyDepth: stats.maxLevel,
      },
      success: totalErrors === 0,
    }
  }
}

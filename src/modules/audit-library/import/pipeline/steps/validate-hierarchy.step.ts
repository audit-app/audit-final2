import { Injectable, Logger } from '@nestjs/common'
import { HierarchyValidatorUtil } from '../../utils'
import { ParsedExcelData, ValidationError } from '../../interfaces/import-data.interface'

/**
 * Validate Hierarchy Step
 *
 * Responsabilidad: SOLO validar estructura jerárquica
 * - Códigos únicos
 * - Referencias a padres existentes
 * - Detección de ciclos
 * - Consistencia de niveles
 */
@Injectable()
export class ValidateHierarchyStep {
  private readonly logger = new Logger(ValidateHierarchyStep.name)

  /**
   * Ejecuta validación de jerarquía
   */
  execute(validatedData: ParsedExcelData): ValidationError[] {
    if (validatedData.standards.length === 0) {
      return []
    }

    this.logger.log('🔗 Validando jerarquía de standards...')

    const hierarchyErrors = HierarchyValidatorUtil.validate(
      validatedData.standards,
    )

    // Convertir errores a nuestro formato
    const errors: ValidationError[] = hierarchyErrors.map((err) => ({
      row: err.row,
      field: err.field,
      value: err.value,
      message: err.message,
    }))

    if (errors.length > 0) {
      this.logger.warn(`⚠️  ${errors.length} errores de jerarquía encontrados`)
    } else {
      this.logger.log('✅ Jerarquía válida')
    }

    return errors
  }
}

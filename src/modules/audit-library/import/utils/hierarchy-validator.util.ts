import { ImportStandardDto } from '../../standards/dtos/import-standard.dto'

/**
 * Validation Error for Hierarchy
 */
export interface HierarchyValidationError {
  row: number
  field: string
  code: string
  value: unknown
  message: string
}

/**
 * Hierarchy Validator Utility
 *
 * Valida la estructura jerárquica de standards:
 * - Códigos únicos
 * - Referencias a padres existentes
 * - Detección de referencias circulares
 * - Consistencia de niveles
 */
export class HierarchyValidatorUtil {
  /**
   * Validate hierarchy structure
   *
   * @param standards - Array of standards to validate
   * @returns Array of validation errors (empty if valid)
   */
  static validate(standards: ImportStandardDto[]): HierarchyValidationError[] {
    const errors: HierarchyValidationError[] = []

    // 1. Validate unique codes
    errors.push(...this.validateUniqueCodes(standards))

    // 2. Validate parent references exist
    errors.push(...this.validateParentReferences(standards))

    // 3. Validate no circular references
    errors.push(...this.validateNoCircularReferences(standards))

    // 4. Validate level consistency
    errors.push(...this.validateLevelConsistency(standards))

    return errors
  }

  /**
   * Validate that all codes are unique
   */
  private static validateUniqueCodes(
    standards: ImportStandardDto[],
  ): HierarchyValidationError[] {
    const errors: HierarchyValidationError[] = []
    const codeCount = new Map<string, number[]>() // code -> [row indices]

    standards.forEach((standard, index) => {
      const code = standard.code
      if (!codeCount.has(code)) {
        codeCount.set(code, [])
      }
      codeCount.get(code)!.push(index + 2) // +2 for Excel row (header is row 1)
    })

    // Find duplicates
    codeCount.forEach((rows, code) => {
      if (rows.length > 1) {
        errors.push({
          row: rows[1], // Report on second occurrence
          field: 'code',
          code,
          value: code,
          message: `Código duplicado "${code}" encontrado en las filas: ${rows.join(', ')}`,
        })
      }
    })

    return errors
  }

  /**
   * Validate that parent codes exist
   */
  private static validateParentReferences(
    standards: ImportStandardDto[],
  ): HierarchyValidationError[] {
    const errors: HierarchyValidationError[] = []
    const validCodes = new Set(standards.map((s) => s.code))

    standards.forEach((standard, index) => {
      const parentCode = this.normalizeParentCode(standard.parentCode)

      // If has parent code, verify it exists
      if (parentCode && !validCodes.has(parentCode)) {
        errors.push({
          row: index + 2,
          field: 'parentCode',
          code: standard.code,
          value: parentCode,
          message: `Código padre "${parentCode}" no encontrado. Verifique que exista en el archivo.`,
        })
      }
    })

    return errors
  }

  /**
   * Validate no circular references in hierarchy
   *
   * Example of circular reference:
   * - A.1 -> parent: A.2
   * - A.2 -> parent: A.1
   */
  private static validateNoCircularReferences(
    standards: ImportStandardDto[],
  ): HierarchyValidationError[] {
    const errors: HierarchyValidationError[] = []
    const codeToParent = new Map<string, string | null>()

    // Build parent map
    standards.forEach((s) => {
      codeToParent.set(s.code, this.normalizeParentCode(s.parentCode))
    })

    // Check each standard for circular references
    standards.forEach((standard, index) => {
      const visited = new Set<string>()
      let current: string | null | undefined = standard.code

      while (current) {
        if (visited.has(current)) {
          // Circular reference detected
          const chain = Array.from(visited).join(' -> ')
          errors.push({
            row: index + 2,
            field: 'parentCode',
            code: standard.code,
            value: standard.parentCode,
            message: `Referencia circular detectada: ${chain} -> ${current}`,
          })
          break
        }

        visited.add(current)
        current = codeToParent.get(current)
      }
    })

    return errors
  }

  /**
   * Validate level consistency
   *
   * - Root standards (no parent) should have level 1
   * - Child standards should have level = parent level + 1
   */
  private static validateLevelConsistency(
    standards: ImportStandardDto[],
  ): HierarchyValidationError[] {
    const errors: HierarchyValidationError[] = []
    const codeToLevel = new Map<string, number>()
    const codeToParent = new Map<string, string | null>()

    // Build maps
    standards.forEach((s) => {
      codeToLevel.set(s.code, s.level)
      codeToParent.set(s.code, this.normalizeParentCode(s.parentCode))
    })

    // Validate each standard
    standards.forEach((standard, index) => {
      const parentCode = this.normalizeParentCode(standard.parentCode)

      if (!parentCode) {
        // Root standard - should have level 1
        if (standard.level !== 1) {
          errors.push({
            row: index + 2,
            field: 'level',
            code: standard.code,
            value: standard.level,
            message: `Estándar raíz "${standard.code}" debe tener nivel 1, pero tiene nivel ${standard.level}`,
          })
        }
      } else {
        // Child standard - level should be parent level + 1
        const parentLevel = codeToLevel.get(parentCode)
        if (parentLevel !== undefined) {
          const expectedLevel = parentLevel + 1
          if (standard.level !== expectedLevel) {
            errors.push({
              row: index + 2,
              field: 'level',
              code: standard.code,
              value: standard.level,
              message:
                `Nivel inconsistente: "${standard.code}" tiene nivel ${standard.level}, ` +
                `pero debería ser ${expectedLevel} (padre "${parentCode}" tiene nivel ${parentLevel})`,
            })
          }
        }
      }
    })

    return errors
  }

  /**
   * Normalize parent code (handle empty strings and null)
   *
   * @param parentCode - Raw parent code from input
   * @returns Normalized parent code (null if empty)
   */
  static normalizeParentCode(parentCode?: string): string | null {
    if (!parentCode || parentCode.trim() === '') {
      return null
    }
    return parentCode.trim()
  }
}

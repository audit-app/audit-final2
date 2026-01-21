import { ImportStandardDto } from '../../standards/dtos/import-standard.dto'
import { HierarchyValidatorUtil } from './hierarchy-validator.util'

/**
 * Standard with parent ID resolved
 */
export interface StandardWithParentId extends Omit<
  ImportStandardDto,
  'parentCode'
> {
  parentId: string | null
}

/**
 * Hierarchy Processor Utility
 *
 * Procesa jerarquías de standards de múltiples niveles de profundidad:
 * - Ordena standards por nivel (padres antes que hijos)
 * - Mantiene mapa de códigos a IDs
 * - Soporta jerarquías arbitrariamente profundas (no solo 2 niveles)
 *
 * Algoritmo:
 * 1. Ordenar por nivel (nivel 1 primero, luego 2, etc.)
 * 2. Dentro de cada nivel, ordenar por 'order'
 * 3. Procesar en orden, construyendo mapa code -> savedId
 */
export class HierarchyProcessorUtil {
  /**
   * Sort standards by hierarchy level (parents before children)
   *
   * @param standards - Standards to sort
   * @returns Sorted standards (level 1, then level 2, etc.)
   */
  static sortByHierarchy(standards: ImportStandardDto[]): ImportStandardDto[] {
    return [...standards].sort((a, b) => {
      // 1. Sort by level (ascending)
      if (a.level !== b.level) {
        return a.level - b.level
      }

      // 2. Within same level, sort by order
      return a.order - b.order
    })
  }

  /**
   * Build parent code to ID mapping
   *
   * @param savedStandards - Standards that have been saved with IDs
   * @returns Map of code to ID
   */
  static buildCodeToIdMap(
    savedStandards: Array<{ code: string; id: string }>,
  ): Map<string, string> {
    const map = new Map<string, string>()
    savedStandards.forEach((standard) => {
      map.set(standard.code, standard.id)
    })
    return map
  }

  /**
   * Resolve parent ID from parent code using map
   *
   * @param parentCode - Parent code from import
   * @param codeToIdMap - Map of codes to IDs
   * @returns Parent ID or null if root standard
   * @throws Error if parent code not found in map
   */
  static resolveParentId(
    parentCode: string | undefined,
    codeToIdMap: Map<string, string>,
  ): string | null {
    const normalizedParentCode =
      HierarchyValidatorUtil.normalizeParentCode(parentCode)

    if (!normalizedParentCode) {
      return null // Root standard
    }

    const parentId = codeToIdMap.get(normalizedParentCode)

    if (!parentId) {
      throw new Error(
        `No se encontró el estándar padre con código: ${normalizedParentCode}. ` +
          `Esto indica un error en la validación previa.`,
      )
    }

    return parentId
  }

  /**
   * Convert ImportStandardDto to StandardWithParentId
   *
   * @param standard - Standard from import
   * @param codeToIdMap - Map of codes to IDs
   * @returns Standard with parentId resolved
   */
  static resolveParent(
    standard: ImportStandardDto,
    codeToIdMap: Map<string, string>,
  ): Omit<ImportStandardDto, 'parentCode'> & { parentId: string | null } {
    const { parentCode, ...rest } = standard
    const parentId = this.resolveParentId(parentCode, codeToIdMap)

    return {
      ...rest,
      parentId,
    }
  }

  /**
   * Group standards by level for debugging
   *
   * @param standards - Standards to group
   * @returns Map of level to standards
   */
  static groupByLevel(
    standards: ImportStandardDto[],
  ): Map<number, ImportStandardDto[]> {
    const grouped = new Map<number, ImportStandardDto[]>()

    standards.forEach((standard) => {
      if (!grouped.has(standard.level)) {
        grouped.set(standard.level, [])
      }
      grouped.get(standard.level)!.push(standard)
    })

    return grouped
  }

  /**
   * Get statistics about hierarchy depth
   *
   * @param standards - Standards to analyze
   * @returns Hierarchy statistics
   */
  static getHierarchyStats(standards: ImportStandardDto[]): {
    totalStandards: number
    maxLevel: number
    levelCounts: Record<number, number>
    rootCount: number
  } {
    const levelCounts: Record<number, number> = {}
    let maxLevel = 0
    let rootCount = 0

    standards.forEach((standard) => {
      // Count by level
      if (!levelCounts[standard.level]) {
        levelCounts[standard.level] = 0
      }
      levelCounts[standard.level]++

      // Track max level
      if (standard.level > maxLevel) {
        maxLevel = standard.level
      }

      // Count roots
      const parentCode = HierarchyValidatorUtil.normalizeParentCode(
        standard.parentCode,
      )
      if (!parentCode) {
        rootCount++
      }
    })

    return {
      totalStandards: standards.length,
      maxLevel,
      levelCounts,
      rootCount,
    }
  }
}

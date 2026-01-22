import { BadRequestException, Injectable } from '@nestjs/common'
import { CreateNestedMaturityLevelDto } from '../../levels/dtos'

/**
 * Validador de Integridad de Niveles de Madurez
 *
 * Asegura que los niveles proporcionados sean consistentes y completos
 */
@Injectable()
export class MaturityLevelsIntegrityValidator {
  /**
   * Valida la integridad de los niveles de madurez
   *
   * @param levels - Array de niveles a validar
   * @param minLevel - Nivel mínimo del framework
   * @param maxLevel - Nivel máximo del framework
   * @throws {BadRequestException} Si hay inconsistencias
   */
  validate(
    levels: CreateNestedMaturityLevelDto[],
    minLevel: number,
    maxLevel: number,
  ): void {
    // 1. Verificar que haya niveles
    if (!levels || levels.length === 0) {
      throw new BadRequestException(
        'Debe proporcionar al menos un nivel de madurez',
      )
    }

    // 2. Calcular cantidad esperada de niveles
    const expectedCount = maxLevel - minLevel + 1
    const actualCount = levels.length

    if (actualCount !== expectedCount) {
      throw new BadRequestException(
        `La cantidad de niveles (${actualCount}) no coincide con el rango definido (${minLevel}-${maxLevel}). ` +
          `Se esperaban ${expectedCount} niveles.`,
      )
    }

    // 3. Extraer números de nivel y verificar duplicados
    const levelNumbers = levels.map((l) => l.level)
    const uniqueLevels = new Set(levelNumbers)

    if (uniqueLevels.size !== levelNumbers.length) {
      const duplicates = this.findDuplicates(levelNumbers)
      throw new BadRequestException(
        `Se encontraron niveles duplicados: ${duplicates.join(', ')}`,
      )
    }

    // 4. Verificar que todos los niveles estén dentro del rango
    const outOfRange = levelNumbers.filter(
      (level) => level < minLevel || level > maxLevel,
    )

    if (outOfRange.length > 0) {
      throw new BadRequestException(
        `Los siguientes niveles están fuera del rango permitido (${minLevel}-${maxLevel}): ${outOfRange.join(', ')}`,
      )
    }

    // 5. Verificar que no haya "huecos" en la secuencia
    const sortedLevels = [...levelNumbers].sort((a, b) => a - b)
    const expectedSequence = Array.from(
      { length: expectedCount },
      (_, i) => minLevel + i,
    )

    const missing = expectedSequence.filter(
      (expected) => !sortedLevels.includes(expected),
    )

    if (missing.length > 0) {
      throw new BadRequestException(
        `Faltan los siguientes niveles en la secuencia: ${missing.join(', ')}. ` +
          `Se requiere una secuencia completa de ${minLevel} a ${maxLevel} sin huecos.`,
      )
    }

    // 6. Validar que el orden sea coherente (si se especifica)
    levels.forEach((level) => {
      if (level.order !== undefined && level.order !== level.level) {
        // Advertencia: permitimos que order sea diferente, pero debería ser consistente
        // En producción, podrías querer forzar que order === level
      }
    })
  }

  /**
   * Encuentra elementos duplicados en un array
   */
  private findDuplicates(arr: number[]): number[] {
    const seen = new Set<number>()
    const duplicates = new Set<number>()

    arr.forEach((item) => {
      if (seen.has(item)) {
        duplicates.add(item)
      }
      seen.add(item)
    })

    return Array.from(duplicates)
  }
}

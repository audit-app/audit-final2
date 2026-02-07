import { Injectable, BadRequestException } from '@nestjs/common'
import { AuditResponseEntity } from '../../entities/audit-response.entity'
import { StandardEntity } from '../../../audit-library/standards/entities/standard.entity'

/**
 * Servicio para cálculo y validación de ponderaciones (weights)
 *
 * Responsabilidades:
 * - Validar que la suma de pesos sea 100
 * - Calcular distribución equitativa de pesos
 * - Normalizar pesos cuando la suma no es exactamente 100
 * - Sugerir ajustes de ponderación
 *
 * Regla de negocio:
 * - La suma de weights de todos los standards auditables debe ser 100
 * - Permite pequeña tolerancia (±0.01) por redondeo de decimales
 */
@Injectable()
export class WeightCalculatorService {
  /**
   * Tolerancia permitida en la suma de pesos por redondeo
   */
  private readonly TOLERANCE = 0.01

  /**
   * Valida que la suma de pesos sea exactamente 100
   * Permite pequeña tolerancia por decimales
   *
   * @param weights - Array de pesos a validar
   * @throws BadRequestException si la suma no es 100
   */
  validateWeightsSum(weights: number[]): void {
    const total = this.calculateTotalWeight(weights)

    if (Math.abs(total - 100) > this.TOLERANCE) {
      throw new BadRequestException(
        `La suma de los pesos debe ser 100 (actual: ${total.toFixed(2)})`,
      )
    }
  }

  /**
   * Valida que la suma de pesos de standards sea 100
   *
   * @param standards - Standards con pesos
   * @throws BadRequestException si la suma no es 100
   */
  validateStandardsWeights(standards: StandardEntity[]): void {
    const auditableStandards = standards.filter((s) => s.isAuditable)
    const weights = auditableStandards.map((s) => s.weight)
    this.validateWeightsSum(weights)
  }

  /**
   * Valida que la suma de pesos de respuestas sea 100
   *
   * @param responses - Respuestas con pesos
   * @throws BadRequestException si la suma no es 100
   */
  validateResponsesWeights(responses: AuditResponseEntity[]): void {
    const weights = responses.map((r) => r.weight)
    this.validateWeightsSum(weights)
  }

  /**
   * Calcula la suma total de pesos
   *
   * @param weights - Array de pesos
   * @returns Suma total
   */
  calculateTotalWeight(weights: number[]): number {
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    return Math.round(total * 100) / 100
  }

  /**
   * Calcula distribución equitativa de pesos
   * Útil cuando se agregan nuevos standards
   *
   * @param count - Cantidad de items
   * @returns Array de pesos equitativos que suman 100
   *
   * @example
   * // Para 3 standards: [33.33, 33.33, 33.34]
   * // Para 4 standards: [25.00, 25.00, 25.00, 25.00]
   */
  calculateEqualWeights(count: number): number[] {
    if (count <= 0) {
      throw new BadRequestException('Debe haber al menos un item para distribuir pesos')
    }

    const baseWeight = Math.floor((100 / count) * 100) / 100
    const weights = Array(count).fill(baseWeight)

    // Ajustar el último peso para que la suma sea exactamente 100
    const currentSum = this.calculateTotalWeight(weights)
    const difference = 100 - currentSum
    weights[count - 1] = Math.round((weights[count - 1] + difference) * 100) / 100

    return weights
  }

  /**
   * Normaliza pesos para que sumen exactamente 100
   * Útil cuando hay pequeños errores de redondeo
   *
   * @param weights - Array de pesos a normalizar
   * @returns Array de pesos normalizados que suman 100
   *
   * @example
   * // Input: [30.5, 40.3, 29.3] (suma = 100.1)
   * // Output: [30.48, 40.28, 29.24] (suma = 100.00)
   */
  normalizeWeights(weights: number[]): number[] {
    const total = this.calculateTotalWeight(weights)

    if (total === 0) {
      throw new BadRequestException('La suma de pesos no puede ser 0')
    }

    // Calcular factor de normalización
    const factor = 100 / total

    // Aplicar factor y redondear
    const normalized = weights.map((w) => Math.round(w * factor * 100) / 100)

    // Ajustar el último peso para compensar errores de redondeo
    const normalizedSum = this.calculateTotalWeight(normalized)
    const difference = 100 - normalizedSum
    normalized[normalized.length - 1] = Math.round((normalized[normalized.length - 1] + difference) * 100) / 100

    return normalized
  }

  /**
   * Redistribuye un peso específico entre los demás items
   * Útil cuando se elimina un standard
   *
   * @param weights - Array de pesos actuales
   * @param indexToRemove - Índice del peso a eliminar
   * @returns Array de pesos redistribuidos (sin el índice eliminado)
   *
   * @example
   * // Input: [30, 40, 30], indexToRemove = 1
   * // Output: [50, 50] (el 40 se redistribuyó entre los otros)
   */
  redistributeWeight(weights: number[], indexToRemove: number): number[] {
    if (indexToRemove < 0 || indexToRemove >= weights.length) {
      throw new BadRequestException('Índice inválido')
    }

    // Obtener peso a redistribuir
    const weightToRedistribute = weights[indexToRemove]

    // Crear nuevo array sin el peso eliminado
    const remaining = weights.filter((_, i) => i !== indexToRemove)

    if (remaining.length === 0) {
      return []
    }

    // Calcular peso total restante
    const remainingTotal = this.calculateTotalWeight(remaining)

    // Redistribuir proporcionalmente
    const redistributed = remaining.map((w) => {
      const proportion = w / remainingTotal
      const additional = weightToRedistribute * proportion
      return Math.round((w + additional) * 100) / 100
    })

    // Normalizar para asegurar suma = 100
    return this.normalizeWeights(redistributed)
  }

  /**
   * Calcula el impacto de cambiar el peso de un item
   * Retorna cuánto deben ajustarse los demás pesos
   *
   * @param currentWeights - Pesos actuales
   * @param index - Índice del peso a cambiar
   * @param newWeight - Nuevo peso deseado
   * @returns Array con pesos ajustados para mantener suma = 100
   */
  calculateWeightImpact(
    currentWeights: number[],
    index: number,
    newWeight: number,
  ): number[] {
    if (index < 0 || index >= currentWeights.length) {
      throw new BadRequestException('Índice inválido')
    }

    if (newWeight < 0 || newWeight > 100) {
      throw new BadRequestException('El peso debe estar entre 0 y 100')
    }

    // Crear copia de pesos
    const adjusted = [...currentWeights]

    // Calcular diferencia
    const difference = newWeight - currentWeights[index]

    // Aplicar nuevo peso
    adjusted[index] = newWeight

    // Redistribuir diferencia entre los demás
    const othersCount = adjusted.length - 1
    if (othersCount > 0) {
      const adjustmentPerItem = -difference / othersCount

      for (let i = 0; i < adjusted.length; i++) {
        if (i !== index) {
          adjusted[i] = Math.round((adjusted[i] + adjustmentPerItem) * 100) / 100
        }
      }
    }

    // Normalizar para asegurar suma = 100
    return this.normalizeWeights(adjusted)
  }

  /**
   * Verifica si la suma de pesos está dentro de la tolerancia
   *
   * @param weights - Pesos a verificar
   * @returns true si la suma es válida, false si no
   */
  isWeightSumValid(weights: number[]): boolean {
    const total = this.calculateTotalWeight(weights)
    return Math.abs(total - 100) <= this.TOLERANCE
  }

  /**
   * Obtiene el peso mínimo, máximo y promedio
   *
   * @param weights - Array de pesos
   * @returns { min, max, average }
   */
  getWeightStatistics(weights: number[]): {
    min: number
    max: number
    average: number
    total: number
  } {
    if (weights.length === 0) {
      return { min: 0, max: 0, average: 0, total: 0 }
    }

    const min = Math.min(...weights)
    const max = Math.max(...weights)
    const total = this.calculateTotalWeight(weights)
    const average = total / weights.length

    return {
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      average: Math.round(average * 100) / 100,
      total: Math.round(total * 100) / 100,
    }
  }
}

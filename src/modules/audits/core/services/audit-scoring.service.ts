import { Injectable } from '@nestjs/common'
import { AuditResponseEntity } from '../../entities/audit-response.entity'
import { ComplianceLevel } from '../../enums/compliance-level.enum'

/**
 * Servicio para cálculo de scores de auditoría
 *
 * Responsabilidades:
 * - Calcular score global de auditoría (overallScore)
 * - Calcular score ponderado por respuesta (weightedScore)
 * - Calcular nivel de madurez promedio
 * - Calcular métricas de cumplimiento
 *
 * Fórmulas:
 * - overallScore = Σ(score × weight) / 100
 * - weightedScore = (score × weight) / 100
 * - maturityLevel = promedio de achievedMaturityLevel de respuestas
 */
@Injectable()
export class AuditScoringService {
  /**
   * Calcula el score global de una auditoría
   * Basado en todas las respuestas evaluadas
   *
   * Fórmula: overallScore = Σ(score × weight / 100)
   *
   * @param responses - Respuestas de la auditoría
   * @returns Score global (0-100)
   *
   * @example
   * // Respuesta 1: score=80, weight=30 → contribuye 24 puntos
   * // Respuesta 2: score=90, weight=70 → contribuye 63 puntos
   * // overallScore = 24 + 63 = 87
   */
  calculateOverallScore(responses: AuditResponseEntity[]): number {
    // Filtrar solo respuestas con score asignado
    const evaluatedResponses = responses.filter((r) => r.score !== null)

    if (evaluatedResponses.length === 0) {
      return 0
    }

    // Sumar score ponderado de cada respuesta
    const totalScore = evaluatedResponses.reduce((sum, response) => {
      return sum + response.weightedScore
    }, 0)

    // Redondear a 2 decimales
    return Math.round(totalScore * 100) / 100
  }

  /**
   * Calcula el score ponderado de una respuesta individual
   * (También disponible como getter en la entidad)
   *
   * Fórmula: weightedScore = (score × weight) / 100
   *
   * @param response - Respuesta individual
   * @returns Score ponderado
   */
  calculateWeightedScore(response: AuditResponseEntity): number {
    if (response.score === null) {
      return 0
    }

    const weighted = (response.score * response.weight) / 100
    return Math.round(weighted * 100) / 100
  }

  /**
   * Calcula el nivel de madurez promedio de una auditoría
   * Solo considera respuestas que tengan achievedMaturityLevel asignado
   *
   * @param responses - Respuestas de la auditoría
   * @returns Nivel de madurez promedio (0-5), null si no hay niveles asignados
   */
  calculateAverageMaturityLevel(
    responses: AuditResponseEntity[],
  ): number | null {
    // Filtrar respuestas con nivel de madurez asignado
    const responsesWithLevel = responses.filter(
      (r) => r.achievedMaturityLevel !== null,
    )

    if (responsesWithLevel.length === 0) {
      return null
    }

    // Calcular promedio
    const totalLevel = responsesWithLevel.reduce(
      (sum, r) => sum + (r.achievedMaturityLevel || 0),
      0,
    )

    const average = totalLevel / responsesWithLevel.length

    // Redondear al entero más cercano (los niveles son enteros)
    return Math.round(average)
  }

  /**
   * Calcula métricas de cumplimiento (compliance metrics)
   * Retorna conteo y porcentajes por nivel de cumplimiento
   *
   * @param responses - Respuestas de la auditoría
   * @returns Métricas de cumplimiento
   */
  calculateComplianceMetrics(responses: AuditResponseEntity[]) {
    const total = responses.length

    // Contar por nivel de cumplimiento
    const compliant = responses.filter(
      (r) => r.complianceLevel === ComplianceLevel.COMPLIANT,
    ).length

    const partial = responses.filter(
      (r) => r.complianceLevel === ComplianceLevel.PARTIAL,
    ).length

    const nonCompliant = responses.filter(
      (r) => r.complianceLevel === ComplianceLevel.NON_COMPLIANT,
    ).length

    const notApplicable = responses.filter(
      (r) => r.complianceLevel === ComplianceLevel.NOT_APPLICABLE,
    ).length

    const notEvaluated = responses.filter(
      (r) => r.complianceLevel === null,
    ).length

    // Calcular porcentajes
    const compliantPercent = total > 0 ? (compliant / total) * 100 : 0
    const partialPercent = total > 0 ? (partial / total) * 100 : 0
    const nonCompliantPercent = total > 0 ? (nonCompliant / total) * 100 : 0
    const notApplicablePercent = total > 0 ? (notApplicable / total) * 100 : 0
    const notEvaluatedPercent = total > 0 ? (notEvaluated / total) * 100 : 0

    return {
      total,
      compliant,
      partial,
      nonCompliant,
      notApplicable,
      notEvaluated,
      compliantPercent: Math.round(compliantPercent * 100) / 100,
      partialPercent: Math.round(partialPercent * 100) / 100,
      nonCompliantPercent: Math.round(nonCompliantPercent * 100) / 100,
      notApplicablePercent: Math.round(notApplicablePercent * 100) / 100,
      notEvaluatedPercent: Math.round(notEvaluatedPercent * 100) / 100,
    }
  }

  /**
   * Verifica si todas las respuestas han sido evaluadas (tienen score)
   *
   * @param responses - Respuestas de la auditoría
   * @returns true si todas tienen score, false si alguna no
   */
  areAllResponsesEvaluated(responses: AuditResponseEntity[]): boolean {
    return responses.every((r) => r.score !== null)
  }

  /**
   * Calcula el porcentaje de progreso de evaluación
   *
   * @param responses - Respuestas de la auditoría
   * @returns Porcentaje (0-100)
   */
  calculateEvaluationProgress(responses: AuditResponseEntity[]): number {
    if (responses.length === 0) {
      return 0
    }

    const evaluated = responses.filter((r) => r.score !== null).length
    const progress = (evaluated / responses.length) * 100

    return Math.round(progress * 100) / 100
  }

  /**
   * Obtiene el score mínimo, máximo y promedio de las respuestas
   *
   * @param responses - Respuestas de la auditoría
   * @returns { min, max, average } o null si no hay respuestas evaluadas
   */
  getScoreStatistics(responses: AuditResponseEntity[]): {
    min: number
    max: number
    average: number
  } | null {
    const evaluatedResponses = responses.filter((r) => r.score !== null)

    if (evaluatedResponses.length === 0) {
      return null
    }

    const scores = evaluatedResponses.map((r) => r.score!)

    const min = Math.min(...scores)
    const max = Math.max(...scores)
    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length

    return {
      min,
      max,
      average: Math.round(average * 100) / 100,
    }
  }

  /**
   * Obtiene las respuestas con menor score (bottom N)
   * Útil para identificar áreas de mejora
   *
   * @param responses - Respuestas de la auditoría
   * @param topN - Cantidad de respuestas a retornar (default: 5)
   * @returns Array de respuestas ordenadas por score ascendente
   */
  getLowestScoringResponses(
    responses: AuditResponseEntity[],
    topN: number = 5,
  ): AuditResponseEntity[] {
    return responses
      .filter((r) => r.score !== null)
      .sort((a, b) => (a.score || 0) - (b.score || 0))
      .slice(0, topN)
  }

  /**
   * Obtiene las respuestas con mayor score (top N)
   * Útil para identificar fortalezas
   *
   * @param responses - Respuestas de la auditoría
   * @param topN - Cantidad de respuestas a retornar (default: 5)
   * @returns Array de respuestas ordenadas por score descendente
   */
  getHighestScoringResponses(
    responses: AuditResponseEntity[],
    topN: number = 5,
  ): AuditResponseEntity[] {
    return responses
      .filter((r) => r.score !== null)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topN)
  }
}

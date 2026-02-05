import { Inject, Injectable } from '@nestjs/common'
import { AuditNotFoundException } from '../../exceptions'
import { AUDITS_REPOSITORY, AUDIT_RESPONSES_REPOSITORY } from '../../tokens'
import type {
  IAuditsRepository,
  IAuditResponsesRepository,
} from '../../repositories'

/**
 * Estadísticas completas de una auditoría
 */
export interface AuditStats {
  /** Score ponderado total (0-100) calculado a partir de respuestas evaluadas */
  overallScore: number

  /** Nivel de madurez promedio ponderado (null si no hay framework o respuestas evaluadas) */
  averageMaturityLevel: number | null

  /** Estadísticas de progreso */
  progress: {
    /** Total de estándares a evaluar */
    total: number
    /** Estándares sin iniciar */
    notStarted: number
    /** Estándares en progreso */
    inProgress: number
    /** Estándares completados (sin revisar) */
    completed: number
    /** Estándares revisados */
    reviewed: number
    /** Porcentaje de completitud (0-100) */
    percentageComplete: number
  }
}

/**
 * Use Case: Obtener estadísticas y scores de una auditoría
 *
 * Responsabilidades:
 * - Calcular score ponderado total de la auditoría
 * - Calcular nivel de madurez promedio ponderado (si aplica)
 * - Obtener estadísticas de progreso (cuántas evaluaciones completadas, pendientes, etc.)
 * - Retornar datos consolidados para dashboard/reportes
 *
 * Flujo:
 * 1. Validar que auditoría existe
 * 2. Calcular score ponderado total usando weights de respuestas
 * 3. Calcular nivel de madurez promedio ponderado (si auditoría tiene framework)
 * 4. Obtener estadísticas de progreso (total, completadas, pendientes, etc.)
 * 5. Retornar objeto consolidado con todas las estadísticas
 *
 * Fórmulas de cálculo:
 * - Score ponderado: Σ(score_i * weight_i / 100) para respuestas evaluadas
 * - Madurez ponderada: Σ(maturityLevel_i * weight_i) / totalWeight
 * - % Completitud: (completed + reviewed) / total * 100
 *
 * Uso típico:
 * - Dashboard de auditoría
 * - Reporte de progreso
 * - Vista previa antes de cerrar auditoría
 * - Comparación entre revisiones
 */
@Injectable()
export class GetAuditStatsUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
    @Inject(AUDIT_RESPONSES_REPOSITORY)
    private readonly responsesRepository: IAuditResponsesRepository,
  ) {}

  async execute(auditId: string): Promise<AuditStats> {
    // 1. Validar que la auditoría exista
    const audit = await this.auditsRepository.findById(auditId)
    if (!audit) {
      throw new AuditNotFoundException(auditId)
    }

    // 2. Calcular score ponderado total
    // Fórmula: Σ(score * weight / 100) para respuestas con score no null
    const overallScore =
      await this.responsesRepository.calculateAuditScore(auditId)

    // 3. Calcular nivel de madurez promedio ponderado (solo si auditoría tiene framework)
    const averageMaturityLevel =
      await this.responsesRepository.calculateAverageMaturityLevel(auditId)

    // 4. Obtener estadísticas de progreso
    const progress = await this.responsesRepository.getProgressStats(auditId)

    return {
      overallScore,
      averageMaturityLevel,
      progress,
    }
  }
}

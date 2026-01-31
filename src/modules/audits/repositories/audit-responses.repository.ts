import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseRepository } from '@core/repositories'
import { TransactionService } from '@core/database'
import { AuditService } from '@core/context'
import { AuditResponseEntity } from '../entities/audit-response.entity'
import { ResponseStatus } from '../enums/response-status.enum'
import type { IAuditResponsesRepository } from './interfaces'

/**
 * Repositorio de Respuestas/Evaluaciones de Auditoría
 */
@Injectable()
export class AuditResponsesRepository
  extends BaseRepository<AuditResponseEntity>
  implements IAuditResponsesRepository
{
  constructor(
    @InjectRepository(AuditResponseEntity)
    repository: Repository<AuditResponseEntity>,
    transactionService: TransactionService,
    auditService: AuditService,
  ) {
    super(repository, transactionService, auditService)
  }

  /**
   * Busca todas las respuestas de una auditoría
   */
  async findByAudit(auditId: string): Promise<AuditResponseEntity[]> {
    return await this.getRepo().find({
      where: { auditId },
      relations: ['standard', 'workPapers'],
      order: { createdAt: 'ASC' },
    })
  }

  /**
   * Busca una respuesta específica por auditoría y estándar
   */
  async findByAuditAndStandard(
    auditId: string,
    standardId: string,
  ): Promise<AuditResponseEntity | null> {
    return await this.getRepo().findOne({
      where: { auditId, standardId },
      relations: ['standard', 'workPapers'],
    })
  }

  /**
   * Busca respuestas asignadas a un usuario específico
   */
  async findByAssignedUser(
    auditId: string,
    userId: string,
  ): Promise<AuditResponseEntity[]> {
    return await this.getRepo().find({
      where: { auditId, assignedUserId: userId },
      relations: ['standard', 'workPapers'],
      order: { createdAt: 'ASC' },
    })
  }

  /**
   * Cuenta respuestas por estado
   */
  async countByStatus(
    auditId: string,
    status: ResponseStatus,
  ): Promise<number> {
    return await this.getRepo().count({
      where: { auditId, status },
    })
  }

  /**
   * Calcula el score total de la auditoría
   * Suma ponderada: (score * weight) para cada respuesta
   */
  async calculateAuditScore(auditId: string): Promise<number> {
    const responses = await this.getRepo().find({
      where: { auditId },
    })

    let totalWeightedScore = 0
    let totalWeight = 0

    for (const response of responses) {
      if (response.score !== null) {
        totalWeightedScore += response.weightedScore
        totalWeight += response.weight
      }
    }

    // Si no hay respuestas evaluadas, retorna 0
    if (totalWeight === 0) return 0

    // Retorna score ponderado total
    return totalWeightedScore
  }

  /**
   * Calcula el nivel de madurez promedio de la auditoría
   * Promedio ponderado de achievedMaturityLevel
   */
  async calculateAverageMaturityLevel(auditId: string): Promise<number | null> {
    const responses = await this.getRepo().find({
      where: { auditId },
    })

    let totalWeightedLevel = 0
    let totalWeight = 0

    for (const response of responses) {
      if (response.achievedMaturityLevel !== null) {
        totalWeightedLevel +=
          response.achievedMaturityLevel * response.weight
        totalWeight += response.weight
      }
    }

    // Si no hay respuestas evaluadas, retorna null
    if (totalWeight === 0) return null

    // Retorna nivel promedio ponderado
    return totalWeightedLevel / totalWeight
  }

  /**
   * Obtiene estadísticas por nodo raíz (para gráficas)
   * Agrupa respuestas por estándar padre y calcula promedios
   */
  async getStatsByRootNode(auditId: string): Promise<
    Array<{
      rootStandardId: string
      rootStandardCode: string
      rootStandardTitle: string
      averageLevel: number
      averageScore: number
      totalWeight: number
      responsesCount: number
    }>
  > {
    // Este query es complejo, se implementará en un use case
    // usando el query builder para hacer JOINs con standards
    return []
  }

  /**
   * Obtiene estadísticas de progreso de la auditoría
   */
  async getProgressStats(auditId: string): Promise<{
    total: number
    notStarted: number
    inProgress: number
    completed: number
    reviewed: number
    percentageComplete: number
  }> {
    const total = await this.getRepo().count({ where: { auditId } })
    const notStarted = await this.countByStatus(
      auditId,
      ResponseStatus.NOT_STARTED,
    )
    const inProgress = await this.countByStatus(
      auditId,
      ResponseStatus.IN_PROGRESS,
    )
    const completed = await this.countByStatus(
      auditId,
      ResponseStatus.COMPLETED,
    )
    const reviewed = await this.countByStatus(auditId, ResponseStatus.REVIEWED)

    const percentageComplete =
      total > 0 ? ((completed + reviewed) / total) * 100 : 0

    return {
      total,
      notStarted,
      inProgress,
      completed,
      reviewed,
      percentageComplete: Math.round(percentageComplete * 100) / 100,
    }
  }
}

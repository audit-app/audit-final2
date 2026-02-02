import type { IBaseRepository } from '@core/repositories'
import type { AuditResponseEntity } from '../../entities/audit-response.entity'
import type { ResponseStatus } from '../../enums/response-status.enum'

/**
 * Audit Responses Repository Interface
 *
 * Define los métodos personalizados para el repositorio de respuestas de auditoría
 */
export interface IAuditResponsesRepository extends IBaseRepository<AuditResponseEntity> {
  findByAudit(auditId: string): Promise<AuditResponseEntity[]>
  findByAuditAndStandard(
    auditId: string,
    standardId: string,
  ): Promise<AuditResponseEntity | null>
  findByAssignedUser(
    auditId: string,
    userId: string,
  ): Promise<AuditResponseEntity[]>
  countByStatus(auditId: string, status: ResponseStatus): Promise<number>
  calculateAuditScore(auditId: string): Promise<number>
  calculateAverageMaturityLevel(auditId: string): Promise<number | null>
  getStatsByRootNode(auditId: string): Promise<
    Array<{
      rootStandardId: string
      rootStandardCode: string
      rootStandardTitle: string
      averageLevel: number
      averageScore: number
      totalWeight: number
      responsesCount: number
    }>
  >
  getProgressStats(auditId: string): Promise<{
    total: number
    notStarted: number
    inProgress: number
    completed: number
    reviewed: number
    percentageComplete: number
  }>
}

import type { IBaseRepository } from '@core/repositories'
import type { AuditWorkPaperEntity } from '../../entities/audit-work-paper.entity'
import type { WorkPaperType } from '../../enums/work-paper-type.enum'

/**
 * Audit Work Papers Repository Interface
 *
 * Define los métodos personalizados para el repositorio de papeles de trabajo
 */
export interface IAuditWorkPapersRepository
  extends IBaseRepository<AuditWorkPaperEntity> {
  findByResponse(responseId: string): Promise<AuditWorkPaperEntity[]>
  findByType(
    responseId: string,
    type: WorkPaperType,
  ): Promise<AuditWorkPaperEntity[]>
  findByUploader(userId: string): Promise<AuditWorkPaperEntity[]>
  countByResponse(responseId: string): Promise<number>
  getTotalFileSize(responseId: string): Promise<number>
}

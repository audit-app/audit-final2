import type { IBaseRepository } from '@core/repositories'
import type { SelectQueryBuilder } from 'typeorm'
import type { AuditEntity } from '../../entities/audit.entity'
import type { AuditStatus } from '../../enums/audit-status.enum'

/**
 * Audits Repository Interface
 *
 * Define los métodos personalizados para el repositorio de auditorías
 */
export interface IAuditsRepository extends IBaseRepository<AuditEntity> {
  findByCode(code: string): Promise<AuditEntity | null>
  findByOrganization(organizationId: string): Promise<AuditEntity[]>
  findByTemplate(templateId: string): Promise<AuditEntity[]>
  findByStatus(status: AuditStatus): Promise<AuditEntity[]>
  findRevisions(parentAuditId: string): Promise<AuditEntity[]>
  findInitialAudits(): Promise<AuditEntity[]>
  findAllRevisions(): Promise<AuditEntity[]>
  getNextRevisionNumber(parentAuditId: string): Promise<number>
  generateNextCode(): Promise<string>
  findByIdWithRelations(id: string): Promise<AuditEntity | null>
  createQueryBuilder(): SelectQueryBuilder<AuditEntity>
}

import type { IBaseRepository } from '@core/repositories'
import type { AuditAssignmentEntity } from '../../entities/audit-assignment.entity'
import type { AuditRole } from '../../enums/audit-role.enum'

/**
 * Audit Assignments Repository Interface
 *
 * Define los métodos personalizados para el repositorio de asignaciones
 */
export interface IAuditAssignmentsRepository
  extends IBaseRepository<AuditAssignmentEntity> {
  findByAudit(auditId: string): Promise<AuditAssignmentEntity[]>
  findByUser(userId: string): Promise<AuditAssignmentEntity[]>
  findByAuditUserAndRole(
    auditId: string,
    userId: string,
    role: AuditRole,
  ): Promise<AuditAssignmentEntity | null>
  isUserAssigned(
    auditId: string,
    userId: string,
    role: AuditRole,
  ): Promise<boolean>
  countActiveMembers(auditId: string): Promise<number>
  findLeadAuditor(auditId: string): Promise<AuditAssignmentEntity | null>
  findAuditors(auditId: string): Promise<AuditAssignmentEntity[]>
  deactivate(id: string): Promise<void>
  reactivate(id: string): Promise<void>
}

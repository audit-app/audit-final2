import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseRepository } from '@core/repositories'
import { TransactionService } from '@core/database'
import { AuditService } from '@core/context'
import { AuditAssignmentEntity } from '../entities/audit-assignment.entity'
import { AuditRole } from '../enums/audit-role.enum'
import type { IAuditAssignmentsRepository } from './interfaces'

/**
 * Repositorio de Asignaciones de Auditoría
 *
 * Gestiona los miembros del equipo de auditoría
 */
@Injectable()
export class AuditAssignmentsRepository
  extends BaseRepository<AuditAssignmentEntity>
  implements IAuditAssignmentsRepository
{
  constructor(
    @InjectRepository(AuditAssignmentEntity)
    repository: Repository<AuditAssignmentEntity>,
    transactionService: TransactionService,
    auditService: AuditService,
  ) {
    super(repository, transactionService, auditService)
  }

  /**
   * Busca todas las asignaciones de una auditoría
   */
  async findByAudit(auditId: string): Promise<AuditAssignmentEntity[]> {
    return await this.getRepo().find({
      where: { auditId, isActive: true },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    })
  }

  /**
   * Busca asignaciones de un usuario
   */
  async findByUser(userId: string): Promise<AuditAssignmentEntity[]> {
    return await this.getRepo().find({
      where: { userId, isActive: true },
      relations: ['audit', 'audit.template', 'audit.organization'],
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Busca una asignación específica por auditoría, usuario y rol
   */
  async findByAuditUserAndRole(
    auditId: string,
    userId: string,
    role: AuditRole,
  ): Promise<AuditAssignmentEntity | null> {
    return await this.getRepo().findOne({
      where: { auditId, userId, role },
    })
  }

  /**
   * Verifica si un usuario ya está asignado a una auditoría con un rol específico
   */
  async isUserAssigned(
    auditId: string,
    userId: string,
    role: AuditRole,
  ): Promise<boolean> {
    const assignment = await this.findByAuditUserAndRole(auditId, userId, role)
    return assignment !== null && assignment.isActive
  }

  /**
   * Cuenta los miembros activos de una auditoría
   */
  async countActiveMembers(auditId: string): Promise<number> {
    return await this.getRepo().count({
      where: { auditId, isActive: true },
    })
  }

  /**
   * Busca el líder de la auditoría (LEAD_AUDITOR)
   */
  async findLeadAuditor(
    auditId: string,
  ): Promise<AuditAssignmentEntity | null> {
    return await this.getRepo().findOne({
      where: { auditId, role: AuditRole.LEAD_AUDITOR, isActive: true },
      relations: ['user'],
    })
  }

  /**
   * Busca todos los auditores (AUDITOR y LEAD_AUDITOR)
   */
  async findAuditors(auditId: string): Promise<AuditAssignmentEntity[]> {
    return await this.getRepo()
      .createQueryBuilder('assignment')
      .where('assignment.auditId = :auditId', { auditId })
      .andWhere('assignment.isActive = :isActive', { isActive: true })
      .andWhere('assignment.role IN (:...roles)', {
        roles: [AuditRole.AUDITOR, AuditRole.LEAD_AUDITOR],
      })
      .leftJoinAndSelect('assignment.user', 'user')
      .orderBy('assignment.createdAt', 'ASC')
      .getMany()
  }

  /**
   * Desactiva una asignación (soft delete)
   */
  async deactivate(id: string): Promise<void> {
    await this.getRepo().update(id, { isActive: false })
  }

  /**
   * Reactiva una asignación
   */
  async reactivate(id: string): Promise<void> {
    await this.getRepo().update(id, { isActive: true })
  }
}

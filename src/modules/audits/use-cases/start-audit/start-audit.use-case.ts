import { Inject, Injectable, BadRequestException } from '@nestjs/common'
import { Transactional } from '@core/database'
import { AuditEntity } from '../../entities/audit.entity'
import { AuditNotFoundException, InvalidAuditStateException } from '../../exceptions'
import { AuditStatus } from '../../enums/audit-status.enum'
import { AUDITS_REPOSITORY, AUDIT_ASSIGNMENTS_REPOSITORY } from '../../tokens'
import type { IAuditsRepository, IAuditAssignmentsRepository } from '../../repositories'

@Injectable()
export class StartAuditUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
    @Inject(AUDIT_ASSIGNMENTS_REPOSITORY)
    private readonly assignmentsRepository: IAuditAssignmentsRepository,
  ) {}

  @Transactional()
  async execute(auditId: string): Promise<AuditEntity> {
    // 1. Validar que la auditoría exista
    const audit = await this.auditsRepository.findById(auditId)
    if (!audit) {
      throw new AuditNotFoundException(auditId)
    }

    // 2. Validar que esté en estado DRAFT
    if (audit.status !== AuditStatus.DRAFT) {
      throw new InvalidAuditStateException(audit.status, 'iniciar')
    }

    // 3. Validar que tenga al menos un miembro asignado
    const membersCount = await this.assignmentsRepository.countActiveMembers(auditId)
    if (membersCount === 0) {
      throw new BadRequestException(
        'No se puede iniciar la auditoría sin miembros asignados',
      )
    }

    // 4. Cambiar estado a IN_PROGRESS
    audit.status = AuditStatus.IN_PROGRESS
    audit.actualStartDate = new Date()

    return await this.auditsRepository.save(audit)
  }
}

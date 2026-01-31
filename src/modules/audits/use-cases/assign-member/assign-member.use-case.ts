import { Injectable, BadRequestException, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { AuditAssignmentEntity } from '../../entities/audit-assignment.entity'
import { AssignMemberDto } from '../../dtos/assign-member.dto'
import {
  AuditNotFoundException,
  InvalidAuditStateException,
} from '../../exceptions'
import { AuditStatus } from '../../enums/audit-status.enum'
import { AUDITS_REPOSITORY, AUDIT_ASSIGNMENTS_REPOSITORY } from '../../tokens'
import type {
  IAuditsRepository,
  IAuditAssignmentsRepository,
} from '../../repositories'

@Injectable()
export class AssignMemberUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
    @Inject(AUDIT_ASSIGNMENTS_REPOSITORY)
    private readonly assignmentsRepository: IAuditAssignmentsRepository,
  ) {}

  @Transactional()
  async execute(
    auditId: string,
    dto: AssignMemberDto,
  ): Promise<AuditAssignmentEntity> {
    // 1. Validar que la auditoría exista
    const audit = await this.auditsRepository.findById(auditId)
    if (!audit) {
      throw new AuditNotFoundException(auditId)
    }

    // 2. Validar que la auditoría esté en estado DRAFT
    if (audit.status !== AuditStatus.DRAFT) {
      throw new InvalidAuditStateException(audit.status, 'asignar miembros')
    }

    // 3. Validar que el usuario no esté ya asignado con ese rol
    const isAlreadyAssigned = await this.assignmentsRepository.isUserAssigned(
      auditId,
      dto.userId,
      dto.role,
    )
    if (isAlreadyAssigned) {
      throw new BadRequestException(
        `El usuario ya está asignado a esta auditoría con el rol ${dto.role}`,
      )
    }

    // 4. Crear la asignación
    const assignment = new AuditAssignmentEntity()
    assignment.auditId = auditId
    assignment.userId = dto.userId
    assignment.role = dto.role
    assignment.assignedStandardIds = dto.assignedStandardIds || null
    assignment.notes = dto.notes || null
    assignment.isActive = true

    return await this.assignmentsRepository.save(assignment)
  }
}

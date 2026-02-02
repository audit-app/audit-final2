import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database'
import { AuditEntity } from '../../entities/audit.entity'
import {
  AuditNotFoundException,
  InvalidAuditStateException,
} from '../../exceptions'
import { AuditStatus } from '../../enums/audit-status.enum'
import { AUDITS_REPOSITORY } from '../../tokens'
import type { IAuditsRepository } from '../../repositories'

@Injectable()
export class CloseAuditUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
  ) {}

  @Transactional()
  async execute(auditId: string): Promise<AuditEntity> {
    // 1. Validar que la auditoría exista
    const audit = await this.auditsRepository.findById(auditId)
    if (!audit) {
      throw new AuditNotFoundException(auditId)
    }

    // 2. Validar que esté en estado IN_PROGRESS
    if (audit.status !== AuditStatus.IN_PROGRESS) {
      throw new InvalidAuditStateException(audit.status, 'cerrar')
    }

    // 3. Cambiar estado a CLOSED
    audit.status = AuditStatus.CLOSED
    audit.closedAt = new Date()

    // Nota: El cálculo de score se hará en una fase futura cuando se implementen respuestas
    // Por ahora, la auditoría se cierra sin score

    return await this.auditsRepository.save(audit)
  }
}

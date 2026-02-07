import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database'
import { AuditEntity } from '../../../entities/audit.entity'
import {
  AuditNotFoundException,
  InvalidAuditStateException,
} from '../../../exceptions'
import { AuditStatus } from '../../../enums/audit-status.enum'
import { AUDITS_REPOSITORY, AUDIT_RESPONSES_REPOSITORY } from '../../../tokens'
import type {
  IAuditsRepository,
  IAuditResponsesRepository,
} from '../../../repositories'

@Injectable()
export class CloseAuditUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
    @Inject(AUDIT_RESPONSES_REPOSITORY)
    private readonly responsesRepository: IAuditResponsesRepository,
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

    // 3. Calcular score ponderado total de la auditoría
    // Fórmula: Σ(score_i * weight_i / 100) para todas las respuestas evaluadas
    const overallScore =
      await this.responsesRepository.calculateAuditScore(auditId)

    // 4. Calcular nivel de madurez promedio ponderado (solo si auditoría tiene framework)
    // Fórmula: Σ(maturityLevel_i * weight_i) / totalWeight
    const averageMaturityLevel =
      await this.responsesRepository.calculateAverageMaturityLevel(auditId)

    // 5. Actualizar auditoría con los resultados calculados
    audit.status = AuditStatus.CLOSED
    audit.closedAt = new Date()
    audit.overallScore = overallScore
    audit.maturityLevel = averageMaturityLevel

    return await this.auditsRepository.save(audit)
  }
}

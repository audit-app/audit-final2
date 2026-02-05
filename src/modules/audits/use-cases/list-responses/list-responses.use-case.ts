import { Inject, Injectable } from '@nestjs/common'
import { AuditResponseEntity } from '../../entities/audit-response.entity'
import { AuditNotFoundException } from '../../exceptions'
import { AUDITS_REPOSITORY, AUDIT_RESPONSES_REPOSITORY } from '../../tokens'
import type {
  IAuditsRepository,
  IAuditResponsesRepository,
} from '../../repositories'

/**
 * Use Case: Listar todas las respuestas/evaluaciones de una auditoría
 *
 * Responsabilidades:
 * - Validar que auditoría existe
 * - Obtener todas las respuestas con información del estándar relacionado
 * - Retornar lista completa de evaluaciones
 *
 * Flujo:
 * 1. Validar que auditoría existe
 * 2. Obtener respuestas con relaciones (estándar, work papers)
 * 3. Retornar lista ordenada por orden del estándar
 *
 * Uso típico:
 * - Ver progreso de auditoría
 * - Listar evaluaciones pendientes/completadas
 * - Dashboard de auditoría
 */
@Injectable()
export class ListResponsesUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
    @Inject(AUDIT_RESPONSES_REPOSITORY)
    private readonly responsesRepository: IAuditResponsesRepository,
  ) {}

  async execute(auditId: string): Promise<AuditResponseEntity[]> {
    // 1. Validar que la auditoría exista
    const audit = await this.auditsRepository.findById(auditId)
    if (!audit) {
      throw new AuditNotFoundException(auditId)
    }

    // 2. Obtener todas las respuestas de la auditoría con relaciones
    const responses = await this.responsesRepository.findByAudit(auditId)

    return responses
  }
}

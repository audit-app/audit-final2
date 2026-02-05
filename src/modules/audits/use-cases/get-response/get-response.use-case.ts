import { Inject, Injectable, BadRequestException } from '@nestjs/common'
import { AuditResponseEntity } from '../../entities/audit-response.entity'
import { AuditNotFoundException } from '../../exceptions'
import { AUDITS_REPOSITORY, AUDIT_RESPONSES_REPOSITORY } from '../../tokens'
import type {
  IAuditsRepository,
  IAuditResponsesRepository,
} from '../../repositories'

/**
 * Use Case: Obtener una respuesta/evaluación específica de auditoría
 *
 * Responsabilidades:
 * - Validar que auditoría existe
 * - Validar que respuesta existe y pertenece a la auditoría
 * - Retornar respuesta con información completa del estándar y work papers
 *
 * Flujo:
 * 1. Validar que auditoría existe
 * 2. Validar que respuesta existe
 * 3. Validar que respuesta pertenece a la auditoría
 * 4. Retornar respuesta con relaciones
 *
 * Uso típico:
 * - Ver detalle de evaluación específica
 * - Editar evaluación
 * - Ver evidencia (work papers) adjunta
 */
@Injectable()
export class GetResponseUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
    @Inject(AUDIT_RESPONSES_REPOSITORY)
    private readonly responsesRepository: IAuditResponsesRepository,
  ) {}

  async execute(
    auditId: string,
    responseId: string,
  ): Promise<AuditResponseEntity> {
    // 1. Validar que la auditoría exista
    const audit = await this.auditsRepository.findById(auditId)
    if (!audit) {
      throw new AuditNotFoundException(auditId)
    }

    // 2. Validar que la respuesta exista
    const response = await this.responsesRepository.findById(responseId)
    if (!response) {
      throw new BadRequestException(
        `Respuesta con ID ${responseId} no encontrada`,
      )
    }

    // 3. Validar que la respuesta pertenezca a esta auditoría
    if (response.auditId !== auditId) {
      throw new BadRequestException(
        'La respuesta no pertenece a esta auditoría',
      )
    }

    return response
  }
}

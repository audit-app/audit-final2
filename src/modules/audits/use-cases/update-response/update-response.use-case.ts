import { Inject, Injectable, BadRequestException } from '@nestjs/common'
import { Transactional } from '@core/database'
import { AuditResponseEntity } from '../../entities/audit-response.entity'
import {
  AuditNotFoundException,
  InvalidAuditStateException,
} from '../../exceptions'
import { AuditStatus } from '../../enums/audit-status.enum'
import { AUDITS_REPOSITORY, AUDIT_RESPONSES_REPOSITORY } from '../../tokens'
import type {
  IAuditsRepository,
  IAuditResponsesRepository,
} from '../../repositories'
import { UpdateResponseDto } from '../../dtos/update-response.dto'

/**
 * Use Case: Actualizar evaluación de un estándar en auditoría
 *
 * Responsabilidades:
 * - Validar que auditoría esté activa (IN_PROGRESS)
 * - Validar que respuesta exista
 * - Actualizar campos de evaluación (score, compliance, findings, etc.)
 * - Mantener trazabilidad (updatedBy automático vía CLS)
 *
 * Flujo:
 * 1. Validar auditoría existe y está IN_PROGRESS
 * 2. Validar respuesta existe
 * 3. Actualizar campos permitidos
 * 4. Guardar cambios
 * 5. Retornar respuesta actualizada
 *
 * Validaciones:
 * - Auditoría debe estar IN_PROGRESS (no cerrada)
 * - Score debe estar en rango 0-100 (validado en DTO)
 * - achievedMaturityLevel debe estar en rango 0-5 (validado en DTO)
 */
@Injectable()
export class UpdateResponseUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
    @Inject(AUDIT_RESPONSES_REPOSITORY)
    private readonly responsesRepository: IAuditResponsesRepository,
  ) {}

  @Transactional()
  async execute(
    auditId: string,
    responseId: string,
    dto: UpdateResponseDto,
  ): Promise<AuditResponseEntity> {
    // 1. Validar que la auditoría exista
    const audit = await this.auditsRepository.findById(auditId)
    if (!audit) {
      throw new AuditNotFoundException(auditId)
    }

    // 2. Validar que la auditoría esté activa (IN_PROGRESS)
    if (audit.status !== AuditStatus.IN_PROGRESS) {
      throw new InvalidAuditStateException(
        audit.status,
        'actualizar evaluaciones',
      )
    }

    // 3. Validar que la respuesta exista y pertenezca a esta auditoría
    const response = await this.responsesRepository.findById(responseId)
    if (!response) {
      throw new BadRequestException(
        `Respuesta con ID ${responseId} no encontrada`,
      )
    }

    if (response.auditId !== auditId) {
      throw new BadRequestException(
        'La respuesta no pertenece a esta auditoría',
      )
    }

    // 4. Actualizar campos permitidos
    if (dto.status !== undefined) {
      response.status = dto.status
    }

    if (dto.achievedMaturityLevel !== undefined) {
      response.achievedMaturityLevel = dto.achievedMaturityLevel
    }

    if (dto.score !== undefined) {
      response.score = dto.score
    }

    if (dto.complianceLevel !== undefined) {
      response.complianceLevel = dto.complianceLevel
    }

    if (dto.findings !== undefined) {
      response.findings = dto.findings
    }

    if (dto.recommendations !== undefined) {
      response.recommendations = dto.recommendations
    }

    if (dto.notes !== undefined) {
      response.notes = dto.notes
    }

    if (dto.assignedUserId !== undefined) {
      response.assignedUserId = dto.assignedUserId
    }

    // 5. Guardar cambios (updatedBy se aplica automáticamente vía CLS)
    return await this.responsesRepository.save(response)
  }
}

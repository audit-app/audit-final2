import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database'
import { AuditResponseEntity } from '../../../entities/audit-response.entity'
import { AUDITS_REPOSITORY, AUDIT_RESPONSES_REPOSITORY } from '../../../tokens'
import type {
  IAuditsRepository,
  IAuditResponsesRepository,
} from '../../../repositories'
import { UpdateResponseDto } from '../../dtos/update-response.dto'
import { AuditValidator, ResponseValidator } from '../../../core/validators'
import { AuditResponseFactory } from '../../../core/factories'

/**
 * Use Case: Actualizar evaluación de un estándar en auditoría
 *
 * Refactorizado para usar:
 * - AuditValidator: Validaciones de auditoría
 * - ResponseValidator: Validaciones de respuesta
 * - AuditResponseFactory: Actualización de entidad desde DTO
 */
@Injectable()
export class UpdateResponseUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
    @Inject(AUDIT_RESPONSES_REPOSITORY)
    private readonly responsesRepository: IAuditResponsesRepository,
    private readonly auditValidator: AuditValidator,
    private readonly responseValidator: ResponseValidator,
    private readonly responseFactory: AuditResponseFactory,
  ) {}

  @Transactional()
  async execute(
    auditId: string,
    responseId: string,
    dto: UpdateResponseDto,
  ): Promise<AuditResponseEntity> {
    // 1. Validar que la auditoría exista y esté activa
    const audit = await this.auditValidator.validateAndGetAudit(auditId)
    this.auditValidator.validateIsActive(audit)

    // 2. Validar que la respuesta exista y pertenezca a esta auditoría
    const response =
      await this.responseValidator.validateAndGetResponse(responseId)
    this.responseValidator.validateBelongsToAudit(response, auditId)

    // 3. Actualizar respuesta usando factory
    this.responseFactory.updateFromDto(response, dto)

    // 4. Guardar cambios (updatedBy se aplica automáticamente vía CLS)
    return await this.responsesRepository.save(response)
  }
}

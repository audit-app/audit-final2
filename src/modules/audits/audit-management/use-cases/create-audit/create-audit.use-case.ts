import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database'
import { AuditEntity } from '../../../entities/audit.entity'
import { CreateAuditDto } from '../../dtos/create-audit.dto'
import { AUDITS_REPOSITORY } from '../../../tokens'
import type { IAuditsRepository } from '../../../repositories'
import { InitializeResponsesUseCase } from '../../../responses/use-cases/initialize-responses'
import { AuditFactory } from '../../../core/factories'
import { AuditValidator } from '../../../core/validators'

/**
 * Use Case: Crear nueva auditoría
 *
 * Refactorizado para usar:
 * - AuditFactory: Creación de entidad desde DTO
 * - AuditValidator: Validaciones de negocio
 * - Lógica de negocio limpia y separada
 */
@Injectable()
export class CreateAuditUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
    private readonly auditFactory: AuditFactory,
    private readonly auditValidator: AuditValidator,
    private readonly initializeResponsesUseCase: InitializeResponsesUseCase,
  ) {}

  @Transactional()
  async execute(dto: CreateAuditDto): Promise<AuditEntity> {
    // 1. Validar que el template exista y esté publicado
    await this.auditValidator.validateTemplateIsPublished(dto.templateId)

    // 2. Validar fechas (si existen)
    this.auditValidator.validateDates(
      dto.startDate ? new Date(dto.startDate) : null,
      dto.endDate ? new Date(dto.endDate) : null,
    )

    // 3. Generar código único
    const code = await this.auditsRepository.generateNextCode()

    // 4. Validar que el código no exista
    await this.auditValidator.validateUniqueCode(code)

    // 5. Crear auditoría usando factory
    const audit = this.auditFactory.createFromDto(dto, code)

    // 6. Guardar auditoría
    const savedAudit = await this.auditsRepository.save(audit)

    // 7. Inicializar respuestas de auditoría
    // Crea AuditResponseEntity por cada standard auditable del template
    await this.initializeResponsesUseCase.execute(savedAudit.id)

    return savedAudit
  }
}

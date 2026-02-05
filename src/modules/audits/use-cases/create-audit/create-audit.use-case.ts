import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database'
import { AuditEntity } from '../../entities/audit.entity'
import { CreateAuditDto } from '../../dtos/create-audit.dto'
import { AuditAlreadyExistsException } from '../../exceptions'
import { TemplateNotFoundException } from '../../../audit-library/templates/exceptions'
import { TemplateStatus } from '../../../audit-library/templates/constants/template-status.enum'
import { AuditStatus } from '../../enums/audit-status.enum'
import { AUDITS_REPOSITORY } from '../../tokens'
import { TEMPLATES_REPOSITORY } from '../../../audit-library/templates/tokens'
import type { IAuditsRepository } from '../../repositories'
import type { ITemplatesRepository } from 'src/modules/audit-library/templates/repositories'
import { InitializeResponsesUseCase } from '../initialize-responses'

@Injectable()
export class CreateAuditUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templatesRepository: ITemplatesRepository,
    private readonly initializeResponsesUseCase: InitializeResponsesUseCase,
  ) {}

  @Transactional()
  async execute(dto: CreateAuditDto): Promise<AuditEntity> {
    // 1. Validar que el template exista y esté publicado
    const template = await this.templatesRepository.findById(dto.templateId)
    if (!template) {
      throw new TemplateNotFoundException(dto.templateId)
    }
    if (template.status !== TemplateStatus.PUBLISHED) {
      throw new Error(
        `El template "${template.name}" debe estar en estado PUBLISHED para crear auditorías (estado actual: ${template.status})`,
      )
    }

    // 2. Generar código único
    const code = await this.auditsRepository.generateNextCode()

    // Verificar que el código no exista (por si acaso)
    const existing = await this.auditsRepository.findByCode(code)
    if (existing) {
      throw new AuditAlreadyExistsException(code)
    }

    // 3. Crear la auditoría
    const audit = new AuditEntity()
    audit.code = code
    audit.name = dto.name
    audit.description = dto.description || null
    audit.templateId = dto.templateId
    audit.organizationId = dto.organizationId
    audit.frameworkId = dto.frameworkId || null
    audit.startDate = dto.startDate ? new Date(dto.startDate) : null
    audit.endDate = dto.endDate ? new Date(dto.endDate) : null
    audit.status = AuditStatus.DRAFT
    audit.revisionNumber = 0
    audit.parentAuditId = null

    const savedAudit = await this.auditsRepository.save(audit)

    // 4. Inicializar respuestas de auditoría
    // Crea AuditResponseEntity por cada standard auditable del template
    await this.initializeResponsesUseCase.execute(savedAudit.id)

    return savedAudit
  }
}

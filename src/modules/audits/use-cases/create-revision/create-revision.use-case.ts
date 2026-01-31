import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database'
import { AuditEntity } from '../../entities/audit.entity'
import { CreateRevisionDto } from '../../dtos/create-revision.dto'
import {
  AuditNotFoundException,
  AuditCannotBeRevisedException,
  AuditAlreadyExistsException,
} from '../../exceptions'
import { AuditStatus } from '../../enums/audit-status.enum'
import { AUDITS_REPOSITORY } from '../../tokens'
import type { IAuditsRepository } from '../../repositories'

@Injectable()
export class CreateRevisionUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
  ) {}

  @Transactional()
  async execute(
    parentAuditId: string,
    dto: CreateRevisionDto,
  ): Promise<AuditEntity> {
    // 1. Validar que la auditoría padre exista
    const parentAudit = await this.auditsRepository.findByIdWithRelations(
      parentAuditId,
    )
    if (!parentAudit) {
      throw new AuditNotFoundException(parentAuditId)
    }

    // 2. Validar que la auditoría padre esté CLOSED
    if (parentAudit.status !== AuditStatus.CLOSED) {
      throw new AuditCannotBeRevisedException(
        parentAuditId,
        parentAudit.status,
      )
    }

    // 3. Obtener el siguiente número de revisión
    const nextRevisionNumber = await this.auditsRepository.getNextRevisionNumber(
      parentAuditId,
    )

    // 4. Generar código único
    const code = await this.auditsRepository.generateNextCode()
    const existing = await this.auditsRepository.findByCode(code)
    if (existing) {
      throw new AuditAlreadyExistsException(code)
    }

    // 5. Generar nombre automático si no se proporciona
    const revisionName =
      dto.name ||
      `${parentAudit.name} (Revisión ${nextRevisionNumber})`

    // 6. Crear la auditoría de revisión heredando del padre
    const revision = new AuditEntity()
    revision.code = code
    revision.name = revisionName
    revision.description = dto.description || null

    // Heredar del padre
    revision.templateId = parentAudit.templateId
    revision.organizationId = parentAudit.organizationId
    revision.frameworkId = dto.frameworkId || parentAudit.frameworkId || null

    // Configurar como revisión
    revision.parentAuditId = parentAuditId
    revision.revisionNumber = nextRevisionNumber

    // Fechas
    revision.startDate = dto.startDate ? new Date(dto.startDate) : null
    revision.endDate = dto.endDate ? new Date(dto.endDate) : null

    // Estado inicial
    revision.status = AuditStatus.DRAFT

    return await this.auditsRepository.save(revision)
  }
}

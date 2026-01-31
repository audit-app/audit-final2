import { Inject, Injectable } from '@nestjs/common'
import { AuditEntity } from '../../entities/audit.entity'
import { FindAuditsDto } from '../../dtos/find-audits.dto'
import { PaginatedResponse } from '@core/dtos'
import { AUDITS_REPOSITORY } from '../../tokens'
import type { IAuditsRepository } from '../../repositories'

@Injectable()
export class FindAuditsUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
  ) {}

  async execute(dto: FindAuditsDto): Promise<PaginatedResponse<AuditEntity>> {
    const queryBuilder = this.auditsRepository.createQueryBuilder()

    // Filtros
    if (dto.status) {
      queryBuilder.andWhere('audit.status = :status', { status: dto.status })
    }

    if (dto.organizationId) {
      queryBuilder.andWhere('audit.organizationId = :organizationId', {
        organizationId: dto.organizationId,
      })
    }

    if (dto.templateId) {
      queryBuilder.andWhere('audit.templateId = :templateId', {
        templateId: dto.templateId,
      })
    }

    if (dto.frameworkId) {
      queryBuilder.andWhere('audit.frameworkId = :frameworkId', {
        frameworkId: dto.frameworkId,
      })
    }

    if (dto.parentAuditId) {
      queryBuilder.andWhere('audit.parentAuditId = :parentAuditId', {
        parentAuditId: dto.parentAuditId,
      })
    }

    if (dto.revisionType === 'initial') {
      queryBuilder.andWhere('audit.parentAuditId IS NULL')
    } else if (dto.revisionType === 'revision') {
      queryBuilder.andWhere('audit.parentAuditId IS NOT NULL')
    }

    // Búsqueda por texto
    if (dto.search) {
      queryBuilder.andWhere(
        '(audit.code ILIKE :search OR audit.name ILIKE :search OR audit.description ILIKE :search)',
        { search: `%${dto.search}%` },
      )
    }

    // Ordenamiento
    const sortBy = dto.sortBy || 'createdAt'
    const sortOrder = dto.sortOrder || 'DESC'
    queryBuilder.orderBy(`audit.${sortBy}`, sortOrder)

    // Paginación
    const page = dto.page || 1
    const limit = dto.limit || 10
    const skip = (page - 1) * limit

    queryBuilder.skip(skip).take(limit)

    const [data, total] = await queryBuilder.getManyAndCount()

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    }
  }
}

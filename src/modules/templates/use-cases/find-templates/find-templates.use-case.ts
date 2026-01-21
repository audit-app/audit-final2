import { Inject, Injectable } from '@nestjs/common'
import type { TemplateEntity } from '../../entities/template.entity'
import { TEMPLATES_REPOSITORY } from '@core'
import type { ITemplatesRepository } from '../../repositories'
import { FindTemplatesDto } from '../../dtos'
import { PaginatedResponse, PaginatedResponseBuilder } from '@core/dtos'

/**
 * Find Templates Use Case
 *
 * Obtiene todos los templates del sistema con filtro opcional por status
 */
@Injectable()
export class FindTemplatesUseCase {
  constructor(
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templatesRepository: ITemplatesRepository,
  ) {}

  async execute(
    dto: FindTemplatesDto,
  ): Promise<PaginatedResponse<TemplateEntity>> {
    const { data, total } =
      await this.templatesRepository.paginateTemplates(dto)

    if (dto.all) {
      return PaginatedResponseBuilder.createAll(data)
    }

    return PaginatedResponseBuilder.create(
      data,
      total,
      dto.page || 1,
      dto.limit || 10,
    )
  }
}

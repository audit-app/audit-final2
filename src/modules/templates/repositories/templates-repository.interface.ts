import type { IBaseRepository } from '@core/repositories'
import type { TemplateEntity } from '../entities/template.entity'
import { FindTemplatesDto } from '../dtos'
import { PaginatedData } from '@core/dtos'

export interface ITemplatesRepository extends IBaseRepository<TemplateEntity> {
  existsByCodeAndVersion(
    code: string,
    version: string,
    excludeId?: string,
  ): Promise<boolean>
  paginateTemplates(
    query: FindTemplatesDto,
  ): Promise<PaginatedData<TemplateEntity>>
}

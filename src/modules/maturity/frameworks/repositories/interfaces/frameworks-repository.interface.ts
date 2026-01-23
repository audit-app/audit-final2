import { IBaseRepository } from '@core'
import type { MaturityFrameworkEntity } from '../../entities/maturity-framework.entity'
import { FindMaturityFrameworksDto } from '../../dtos'
import { PaginatedData } from '@core/dtos'

export interface IFrameworksRepository extends IBaseRepository<MaturityFrameworkEntity> {
  findByCode(code: string): Promise<MaturityFrameworkEntity | null>
  findOneWithLevels(id: string): Promise<MaturityFrameworkEntity | null>
  paginateFrameworks(
    query: FindMaturityFrameworksDto,
  ): Promise<PaginatedData<MaturityFrameworkEntity>>
}

import { Inject, Injectable } from '@nestjs/common'

import type { FindMaturityFrameworksDto } from '../../dtos'
import type { MaturityFrameworkEntity } from '../../entities/maturity-framework.entity'
import { PaginatedResponse, PaginatedResponseBuilder } from '@core/dtos'
import { FRAMEWORKS_REPOSITORY } from '../../tokens'
import type { IFrameworksRepository } from '../../repositories'

/**
 * Find Maturity Frameworks Use Case
 *
 * Lista frameworks de madurez con filtros opcionales
 */
@Injectable()
export class FindFrameworksUseCase {
  constructor(
    @Inject(FRAMEWORKS_REPOSITORY)
    private readonly frameworksRepository: IFrameworksRepository,
  ) {}

  /**
   * Ejecuta la búsqueda de frameworks
   *
   * @param query - Parámetros de búsqueda
   * @returns Lista de frameworks
   */
  async execute(
    dto: FindMaturityFrameworksDto = {},
  ): Promise<PaginatedResponse<MaturityFrameworkEntity>> {
    const { data, total } =
      await this.frameworksRepository.paginateFrameworks(dto)

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

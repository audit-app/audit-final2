import { Inject, Injectable } from '@nestjs/common'

import type { FindMaturityFrameworksDto } from '../../dtos'
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
   * @returns Lista de frameworks con campos calculados (totalLevels, levelRange)
   */
  async execute(
    dto: FindMaturityFrameworksDto = {},
  ): Promise<PaginatedResponse<any>> {
    const { data, total } =
      await this.frameworksRepository.paginateFrameworks(dto)

    // Mapear para incluir campos calculados
    const mappedData = data.map((framework) => ({
      ...framework,
      totalLevels: framework.maxLevel - framework.minLevel + 1,
    }))

    if (dto.all) {
      return PaginatedResponseBuilder.createAll(mappedData)
    }

    return PaginatedResponseBuilder.create(
      mappedData,
      total,
      dto.page || 1,
      dto.limit || 10,
    )
  }
}

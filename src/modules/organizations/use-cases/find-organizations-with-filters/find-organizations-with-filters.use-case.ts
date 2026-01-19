import { Injectable, Inject } from '@nestjs/common'
import { PaginatedResponse, PaginatedResponseBuilder } from '@core/dtos'
import { OrganizationEntity } from '../../entities/organization.entity'
import { FindOrganizationsDto } from './find-organizations.dto'
import { ORGANIZATION_REPOSITORY } from '../../tokens'
import type { IOrganizationRepository } from '../../repositories'

/**
 * Caso de uso: Buscar organizaciones con filtros y paginación
 *
 * Responsabilidades:
 * - Construir filtros desde query params
 * - Aplicar paginación o devolver todos los resultados
 * - Retornar respuesta paginada estructurada
 */
@Injectable()
export class FindOrganizationsWithFiltersUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(
    dto: FindOrganizationsDto,
  ): Promise<PaginatedResponse<OrganizationEntity>> {
    // 1. Obtener Entidades del Repo
    const { data, total } =
      await this.organizationRepository.paginateOrganizations(dto)

    // 3. Devolver respuesta paginada
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

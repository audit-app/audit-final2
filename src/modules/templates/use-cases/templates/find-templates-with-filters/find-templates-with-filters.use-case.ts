import { Injectable } from '@nestjs/common'
import { PaginatedResponse, PaginatedResponseBuilder } from '@core/dtos'
import { TemplateEntity } from '../../../entities/template.entity'
import { FindTemplatesDto } from '../../../dtos'
import { TemplatesRepository } from '../../../repositories/templates.repository'
import type { TemplateFilters } from '../../../repositories/interfaces/templates-repository.interface'

/**
 * Caso de uso: Buscar plantillas con filtros y paginación
 *
 * Responsabilidades:
 * - Construir filtros desde query params
 * - Aplicar paginación o devolver todos los resultados
 * - Retornar respuesta paginada estructurada
 */
@Injectable()
export class FindTemplatesWithFiltersUseCase {
  constructor(private readonly templatesRepository: TemplatesRepository) {}

  async execute(
    query: FindTemplatesDto,
  ): Promise<PaginatedResponse<TemplateEntity>> {
    const {
      page = 1,
      limit = 10,
      all = false,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      status,
    } = query

    // Construir filtros
    const filters: TemplateFilters = {
      search,
      status,
    }

    // Si all=true, devolver todos los registros
    if (all) {
      const [data] = await this.templatesRepository.findWithFilters(
        filters,
        undefined,
        undefined,
        sortBy,
        sortOrder,
      )
      return PaginatedResponseBuilder.createAll(data)
    }

    // Paginación normal
    const [data, total] = await this.templatesRepository.findWithFilters(
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    )

    return PaginatedResponseBuilder.create(data, total, page, limit)
  }
}

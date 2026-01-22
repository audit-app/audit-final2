import { Injectable, Inject } from '@nestjs/common'
import type { StandardEntity } from '../../entities/standard.entity'
import { PaginatedResponse, PaginatedResponseBuilder } from '@core/dtos'
import type { IStandardsRepository } from '../../repositories'
import { STANDARDS_REPOSITORY } from '@core'
import { FindStandardsDto } from '../../dtos'

/**
 * Get Template Standards Tree Use Case
 *
 * Obtiene los standards en estructura jerárquica (Árbol).
 * Soporta filtrado por texto manteniendo la jerarquía de padres.
 */
@Injectable()
export class GetTemplateStandardsTreeUseCase {
  constructor(
    @Inject(STANDARDS_REPOSITORY)
    private readonly standardsRepository: IStandardsRepository,
  ) {}

  /**
   * Ejecuta la obtención del árbol
   *
   * @param templateId - ID del template
   * @param search - (Opcional) Texto a buscar en código, título o descripción
   * @returns Lista de standards raíz (con hijos anidados)
   */
  async execute(
    dto: FindStandardsDto,
  ): Promise<PaginatedResponse<StandardEntity>> {
    //TODO: Aumentar logica de vlacion de template
    const data = await this.standardsRepository.getTree(
      dto.templateId,
      dto.search,
    )
    return PaginatedResponseBuilder.createAll(data)
  }
}

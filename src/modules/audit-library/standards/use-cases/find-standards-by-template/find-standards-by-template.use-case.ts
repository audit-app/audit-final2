import { Injectable } from '@nestjs/common'
import { StandardsRepository } from '../../repositories/standards.repository'
import type { StandardEntity } from '../../entities/standard.entity'
import { PaginatedResponse, PaginatedResponseBuilder } from '@core/dtos'
import { StandardValidator } from '../../validators'

/**
 * Get Template Standards Tree Use Case
 *
 * Obtiene los standards en estructura jerárquica (Árbol).
 * Soporta filtrado por texto manteniendo la jerarquía de padres.
 */
@Injectable()
export class GetTemplateStandardsTreeUseCase {
  constructor(
    private readonly standardsRepository: StandardsRepository,
    private readonly standardsValidator: StandardValidator,
  ) {}

  /**
   * Ejecuta la obtención del árbol
   *
   * @param templateId - ID del template
   * @param search - (Opcional) Texto a buscar en código, título o descripción
   * @returns Lista de standards raíz (con hijos anidados)
   */
  async execute(
    templateId: string,
    search?: string,
  ): Promise<PaginatedResponse<StandardEntity>> {
    //TODO: Aumentar logica de vlacion de template
    const data = await this.standardsRepository.getTree(templateId, search)
    return PaginatedResponseBuilder.createAll(data)
  }
}

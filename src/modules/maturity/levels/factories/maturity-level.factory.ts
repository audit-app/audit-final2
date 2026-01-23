import { Injectable } from '@nestjs/common'
import { MaturityLevelEntity } from '../entities'
import type { UpdateMaturityLevelDto } from '../dtos/update-maturity-level.dto'

/**
 * Factory para niveles de madurez
 *
 * NOTA: Este factory NO incluye createFromDto porque los niveles
 * se crean SIEMPRE de forma anidada con el framework (creación atómica).
 * TypeORM cascade se encarga de la creación automática.
 */
@Injectable()
export class MaturityLevelFactory {
  /**
   * Actualiza una entidad existente.
   * Solo actualiza los campos que vienen definidos en el DTO.
   *
   * @param level - La entidad original recuperada de la BD
   * @param dto - Los datos a actualizar (Partial)
   * @returns La misma entidad con los datos nuevos
   */

  updateFromDto(
    level: MaturityLevelEntity,
    dto: UpdateMaturityLevelDto,
  ): MaturityLevelEntity {
    if (dto.name !== undefined) {
      level.name = dto.name.trim()
    }

    if (dto.shortName !== undefined) {
      level.shortName = dto.shortName?.trim() || null
    }

    if (dto.description !== undefined) {
      level.description = dto.description.trim()
    }

    if (dto.color !== undefined) {
      level.color = dto.color.trim().toUpperCase()
    }

    if (dto.recommendations !== undefined) {
      level.recommendations = dto.recommendations?.trim() || null
    }

    if (dto.observations !== undefined) {
      level.observations = dto.observations?.trim() || null
    }

    if (dto.isMinimumAcceptable !== undefined) {
      level.isMinimumAcceptable = dto.isMinimumAcceptable
    }

    if (dto.isTarget !== undefined) {
      level.isTarget = dto.isTarget
    }

    return level
  }
}

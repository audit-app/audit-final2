import { Injectable } from '@nestjs/common'
import { MaturityLevelEntity } from '../entities'
import type { CreateMaturityLevelDto } from '../dtos/create-maturity-level.dto'
import type { UpdateMaturityLevelDto } from '../dtos/update-maturity-level.dto'

@Injectable()
export class MaturityLevelFactory {
  /**
   * Crea una nueva entidad MaturityLevelEntity desde el DTO.
   * Aplica normalización de datos (trim).
   *
   * @param dto - Datos del level a crear
   * @returns Nueva instancia de MaturityLevelEntity (lista para guardar)
   */
  createFromDto(dto: CreateMaturityLevelDto): MaturityLevelEntity {
    const level = new MaturityLevelEntity()
    level.frameworkId = dto.frameworkId
    level.level = dto.level
    level.name = dto.name.trim()
    level.shortName = dto.shortName?.trim() || null
    level.description = dto.description.trim()
    level.color = dto.color.trim().toUpperCase()
    level.icon = dto.icon?.trim() || null
    level.recommendations = dto.recommendations?.trim() || null
    level.observations = dto.observations?.trim() || null
    level.order = dto.order
    level.isMinimumAcceptable = dto.isMinimumAcceptable ?? false
    level.isTarget = dto.isTarget ?? false
    return level
  }

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

    if (dto.icon !== undefined) {
      level.icon = dto.icon?.trim() || null
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

import { Injectable } from '@nestjs/common'
import { MaturityFrameworkEntity } from '../entities'
import type { CreateMaturityFrameworkDto } from '../dtos/create-maturity-framework.dto'
import type { UpdateMaturityFrameworkDto } from '../dtos/update-maturity-framework.dto'
import { CreateNestedMaturityLevelDto, MaturityLevelEntity } from '../../levels'

@Injectable()
export class FrameworkFactory {
  /**
   * Crea una nueva entidad MaturityFrameworkEntity desde el DTO.
   * Aplica normalización de datos (trim, lowercase para code).
   *
   * @param dto - Datos del framework a crear
   * @returns Nueva instancia de MaturityFrameworkEntity
   */
  createFromDto(dto: CreateMaturityFrameworkDto): MaturityFrameworkEntity {
    const framework = new MaturityFrameworkEntity()
    framework.name = dto.name.trim()
    framework.code = dto.code.trim().toLowerCase()
    framework.description = dto.description?.trim() || null
    framework.minLevel = dto.minLevel
    framework.maxLevel = dto.maxLevel
    framework.isActive = true
    return framework
  }

  /**
   * Actualiza una entidad existente.
   * Solo actualiza los campos que vienen definidos en el DTO.
   *
   * @param framework - La entidad original recuperada de la BD
   * @param dto - Los datos a actualizar (Partial)
   * @returns La misma entidad con los datos nuevos
   */
  updateFromDto(
    framework: MaturityFrameworkEntity,
    dto: UpdateMaturityFrameworkDto,
  ): MaturityFrameworkEntity {
    if (dto.name !== undefined) {
      framework.name = dto.name.trim()
    }

    if (dto.code !== undefined) {
      framework.code = dto.code.trim().toLowerCase()
    }

    if (dto.description !== undefined) {
      framework.description = dto.description?.trim() || null
    }

    return framework
  }

  createFromNestedDto(
    dto: CreateNestedMaturityLevelDto,
    framework: MaturityFrameworkEntity,
    arrivalIndex: number = 0, // Nuevo parámetro por defecto 0
  ): MaturityLevelEntity {
    const entity = new MaturityLevelEntity()

    // 1. Campos directos
    entity.level = dto.level
    entity.name = dto.name
    entity.description = dto.description
    entity.color = dto.color

    // 2. Campos opcionales
    entity.shortName = dto.shortName ?? null
    entity.recommendations = dto.recommendations ?? null
    entity.observations = dto.observations ?? null
    entity.isMinimumAcceptable = dto.isMinimumAcceptable ?? false
    entity.isTarget = dto.isTarget ?? false

    // 3. Lógica de Orden (Aquí está el cambio clave)
    // Prioridad 1: Si el frontend mandó un orden específico, lo respetamos (dto.order).
    // Prioridad 2: Si no, usamos el 'arrivalIndex' (su posición en el array).
    entity.order = dto.order ?? arrivalIndex

    // 4. Vinculación
    entity.framework = framework

    return entity
  }

  /**
   * Crea múltiples niveles pasando el índice del array como orden.
   */
  createManyFromNestedDtos(
    dtos: CreateNestedMaturityLevelDto[],
    framework: MaturityFrameworkEntity,
  ): MaturityLevelEntity[] {
    // El método .map nos da el elemento (dto) y su índice (index)
    // Pasamos ese index como el 'arrivalIndex'
    return dtos.map((dto, index) =>
      this.createFromNestedDto(dto, framework, index),
    )
  }
}

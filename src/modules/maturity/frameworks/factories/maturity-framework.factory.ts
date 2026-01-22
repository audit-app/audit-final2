import { Injectable } from '@nestjs/common'
import { MaturityFrameworkEntity } from '../entities'
import type { CreateMaturityFrameworkDto } from '../dtos/create-maturity-framework.dto'
import type { UpdateMaturityFrameworkDto } from '../dtos/update-maturity-framework.dto'

@Injectable()
export class MaturityFrameworkFactory {
  /**
   * Crea una nueva entidad MaturityFrameworkEntity desde el DTO.
   * Aplica normalización de datos (trim, lowercase para code).
   *
   * @param dto - Datos del framework a crear
   * @returns Nueva instancia de MaturityFrameworkEntity (lista para guardar)
   */
  createFromDto(dto: CreateMaturityFrameworkDto): MaturityFrameworkEntity {
    const framework = new MaturityFrameworkEntity()
    framework.name = dto.name.trim()
    framework.code = dto.code.trim().toLowerCase()
    framework.description = dto.description?.trim() || null
    framework.minLevel = dto.minLevel ?? 0
    framework.maxLevel = dto.maxLevel ?? 5
    framework.isActive = dto.isActive ?? true
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

    if (dto.isActive !== undefined) {
      framework.isActive = dto.isActive
    }

    return framework
  }
}

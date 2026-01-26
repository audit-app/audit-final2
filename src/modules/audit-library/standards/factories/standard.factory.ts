import { Injectable } from '@nestjs/common'
import { StandardEntity } from '../entities'
import type { CreateStandardDto } from '../dtos/create-standard.dto'
import type { UpdateStandardDto } from '../dtos/update-standard.dto'

@Injectable()
export class StandardFactory {
  /**
   * Crea una nueva entidad StandardEntity desde el DTO.
   * Aplica normalización de datos (trim).
   *
   * @param dto - Datos del standard a crear
   * @param level - Nivel calculado en la jerarquía
   * @param order - Orden calculado automáticamente
   * @returns Nueva instancia de StandardEntity (lista para guardar)
   */
  createFromDto(
    dto: CreateStandardDto,
    level: number,
    order: number,
  ): StandardEntity {
    const standard = new StandardEntity()
    standard.templateId = dto.templateId
    standard.parentId = dto.parentId ?? null
    standard.code = dto.code.trim()
    standard.title = dto.title.trim()
    standard.description = dto.description?.trim() || null
    standard.order = order
    standard.level = level
    standard.isAuditable = false
    return standard
  }

  /**
   * Actualiza una entidad existente.
   * Solo actualiza campos de texto (code, title, description)
   * Los campos order e isAuditable tienen endpoints específicos
   *
   * @param standard - La entidad original recuperada de la BD
   * @param dto - Los datos a actualizar (solo textos)
   * @returns La misma entidad con los datos nuevos
   */
  updateFromDto(
    standard: StandardEntity,
    dto: UpdateStandardDto,
  ): StandardEntity {
    /*  if (dto.code !== undefined) {
      standard.code = dto.code.trim()
    } */

    if (dto.title !== undefined) {
      standard.title = dto.title.trim()
    }

    if (dto.description !== undefined) {
      standard.description = dto.description?.trim() || null
    }

    return standard
  }
}

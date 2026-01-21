import { Injectable } from '@nestjs/common'
import { TemplateEntity } from '../entities'
import { CreateTemplateDto, UpdateTemplateDto } from '../dtos'

@Injectable()
export class TemplateFactory {
  /**
   * Crea una nueva entidad TemplateEntity desde el DTO.
   * Aplica normalización de datos (trim, uppercase).
   *
   * @param dto - Datos de la plantilla a crear
   * @returns Nueva instancia de TemplateEntity (lista para guardar)
   */
  createFromDto(dto: CreateTemplateDto): TemplateEntity {
    const template = new TemplateEntity()
    template.code = dto.code.trim().toUpperCase()
    template.name = dto.name.trim()
    template.version = dto.version.trim()
    template.description = dto.description?.trim() || null
    return template
  }

  /**
   * Actualiza una entidad existente.
   * Solo actualiza los campos que vienen definidos en el DTO.
   *
   * @param template - La entidad original recuperada de la BD
   * @param dto - Los datos a actualizar (Partial)
   * @returns La misma entidad con los datos nuevos
   */
  updateFromDto(
    template: TemplateEntity,
    dto: UpdateTemplateDto,
  ): TemplateEntity {
    if (dto.code !== undefined) {
      template.code = dto.code.trim().toUpperCase()
    }

    if (dto.name !== undefined) {
      template.name = dto.name.trim()
    }

    if (dto.version !== undefined) {
      template.version = dto.version.trim()
    }

    if (dto.description !== undefined) {
      template.description = dto.description?.trim() || null
    }

    return template
  }
}

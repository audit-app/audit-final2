import { Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import { TemplatesRepository } from '../../../repositories/templates.repository'
import {
  TemplateNotFoundException,
  TemplateNotEditableException,
} from '../../../exceptions'
import type { UpdateTemplateDto } from './update-template.dto'
import type { TemplateEntity } from '../../../entities/template.entity'

/**
 * Update Template Use Case
 *
 * Actualiza un template existente
 *
 * Reglas de negocio:
 * - El template debe existir
 * - El template debe estar en estado DRAFT (editable)
 * - Templates PUBLISHED/ARCHIVED no pueden editarse
 * - La versión NO puede modificarse (se calcula automáticamente al crear)
 * - El status NO puede modificarse (usar endpoints publish/archive)
 *
 * Campos editables:
 * - name (nombre de la plantilla)
 * - description (descripción)
 */
@Injectable()
export class UpdateTemplateUseCase {
  constructor(private readonly templatesRepository: TemplatesRepository) {}

  /**
   * Ejecuta la actualización del template
   *
   * @param id - ID del template
   * @param dto - Datos a actualizar (nombre y/o descripción)
   * @returns Template actualizado
   * @throws {TemplateNotFoundException} Si el template no existe
   * @throws {TemplateNotEditableException} Si el template no es editable
   */
  @Transactional()
  async execute(id: string, dto: UpdateTemplateDto): Promise<TemplateEntity> {
    // 1. Buscar el template
    const template = await this.templatesRepository.findById(id)
    if (!template) {
      throw new TemplateNotFoundException(id)
    }

    // 2. Verificar que sea editable (solo DRAFT)
    if (!template.isEditable) {
      throw new TemplateNotEditableException(id, template.status)
    }

    // 3. Actualizar campos permitidos
    if (dto.name !== undefined) template.name = dto.name
    if (dto.description !== undefined) template.description = dto.description

    // Nota: version y status NO se actualizan aquí
    // - version: se calcula automáticamente al crear
    // - status: usar endpoints POST /templates/:id/publish o /archive

    // 4. Guardar cambios
    return await this.templatesRepository.save(template)
  }
}

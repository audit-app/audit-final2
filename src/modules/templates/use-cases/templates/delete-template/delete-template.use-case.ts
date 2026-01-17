import { Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import { TemplatesRepository } from '../../../repositories/templates.repository'
import { TemplateEntity } from '../../../entities/template.entity'
import {
  TemplateNotFoundException,
  TemplateNotEditableException,
} from '../../../exceptions'

/**
 * Delete Template Use Case
 *
 * Elimina un template (soft delete)
 *
 * Reglas de negocio:
 * - El template debe existir
 * - El template debe estar en estado draft
 * - Templates published/archived no pueden eliminarse directamente
 */
@Injectable()
export class DeleteTemplateUseCase {
  constructor(private readonly templatesRepository: TemplatesRepository) {}

  /**
   * Ejecuta la eliminación del template
   *
   * @param id - ID del template
   * @returns Template eliminado
   * @throws {TemplateNotFoundException} Si el template no existe
   * @throws {TemplateNotEditableException} Si el template no es editable
   */
  @Transactional()
  async execute(id: string): Promise<TemplateEntity> {
    const template = await this.templatesRepository.findById(id)

    if (!template) {
      throw new TemplateNotFoundException(id)
    }

    if (!template.isEditable) {
      throw new TemplateNotEditableException(id, template.status)
    }

    // Guardar copia antes de eliminar para retornarla
    const removedTemplate = { ...template }
    await this.templatesRepository.softDelete(id)

    return template
  }
}

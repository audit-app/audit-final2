import { Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import { TemplatesRepository } from '../../../repositories/templates.repository'
import { TemplateNotFoundException } from '../../../exceptions'
import { TemplateStatus } from '../../../constants/template-status.enum'
import type { TemplateEntity } from '../../../entities/template.entity'

/**
 * Publish Template Use Case
 *
 * Publica un template (DRAFT → PUBLISHED)
 *
 * Reglas de negocio:
 * - Solo templates en estado DRAFT pueden ser publicados
 * - Templates PUBLISHED se vuelven READ-ONLY (no editables)
 * - Al publicar, si existe otro template PUBLISHED con el mismo nombre,
 *   el anterior pasa automáticamente a ARCHIVED
 * - Solo puede haber UN template PUBLISHED por nombre a la vez
 *
 * Flujo:
 * 1. Buscar el template a publicar
 * 2. Buscar si existe un template PUBLISHED con el mismo nombre
 * 3. Si existe, archivarlo automáticamente
 * 4. Publicar el nuevo template
 */
@Injectable()
export class PublishTemplateUseCase {
  constructor(private readonly templatesRepository: TemplatesRepository) {}

  /**
   * Ejecuta la publicación del template
   *
   * @param id - ID del template a publicar
   * @returns Template publicado
   * @throws {TemplateNotFoundException} Si el template no existe
   */
  @Transactional()
  async execute(id: string): Promise<TemplateEntity> {
    // 1. Buscar el template a publicar
    const template = await this.templatesRepository.findById(id)

    if (!template) {
      throw new TemplateNotFoundException(id)
    }

    // 2. Buscar si existe un template PUBLISHED con el mismo nombre (diferente versión)
    const publishedTemplates = await this.templatesRepository.findAllTemplates({
      where: {
        name: template.name,
        status: TemplateStatus.PUBLISHED,
      },
    })

    // 3. Archivar el template PUBLISHED anterior (si existe)
    if (publishedTemplates.length > 0) {
      for (const previousTemplate of publishedTemplates) {
        // Solo archivar si es diferente al que estamos publicando
        if (previousTemplate.id !== template.id) {
          await this.templatesRepository.updateStatus(
            previousTemplate.id,
            TemplateStatus.ARCHIVED,
          )
        }
      }
    }

    // 4. Publicar el nuevo template
    const updatedTemplate = await this.templatesRepository.updateStatus(
      id,
      TemplateStatus.PUBLISHED,
    )

    if (!updatedTemplate) {
      throw new TemplateNotFoundException(id)
    }

    return updatedTemplate
  }
}

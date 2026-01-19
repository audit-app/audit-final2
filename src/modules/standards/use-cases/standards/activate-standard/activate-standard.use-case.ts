import { Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import { StandardsRepository } from '../../../repositories/standards.repository'
import { TemplatesRepository } from '../../../../templates/repositories/templates.repository'
import { TemplateNotEditableException } from '../../../../templates/exceptions'
import { StandardNotFoundException } from '../../../exceptions'
import type { StandardEntity } from '../../../entities/standard.entity'

/**
 * Activate Standard Use Case
 *
 * Activa un estándar (cambia isActive a true)
 */
@Injectable()
export class ActivateStandardUseCase {
  constructor(
    private readonly standardsRepository: StandardsRepository,
    private readonly templatesRepository: TemplatesRepository,
  ) {}

  @Transactional()
  async execute(id: string): Promise<StandardEntity> {
    // 1. Buscar el estándar
    const standard = await this.standardsRepository.findById(id)
    if (!standard) {
      throw new StandardNotFoundException(id)
    }

    // 2. Validar que la plantilla sea editable
    const template = await this.templatesRepository.findById(
      standard.templateId,
    )
    if (!template?.isEditable) {
      throw new TemplateNotEditableException(
        standard.templateId,
        template?.status || 'unknown',
      )
    }

    // 3. Activar el estándar
    return await this.standardsRepository.patch(standard, { isActive: true })
  }
}

import { Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import { StandardsRepository } from '../../../repositories/standards.repository'
import { TemplatesRepository } from '../../../repositories/templates.repository'
import {
  StandardNotFoundException,
  TemplateNotEditableException,
} from '../../../exceptions'
import type { StandardEntity } from '../../../entities/standard.entity'

/**
 * Deactivate Standard Use Case
 *
 * Desactiva un estándar (cambia isActive a false)
 */
@Injectable()
export class DeactivateStandardUseCase {
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

    // 3. Desactivar el estándar
    return await this.standardsRepository.patch(standard, { isActive: false })
  }
}

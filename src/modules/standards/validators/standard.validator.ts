import { Injectable, Inject } from '@nestjs/common'
import type { StandardsRepository } from '../repositories/standards.repository'
import type { TemplatesRepository } from '../../templates/repositories/templates.repository'
import { StandardEntity } from '../entities'
import { TemplateEntity } from '../../templates/entities'
import { STANDARDS_REPOSITORY, TEMPLATES_REPOSITORY } from '@core'
import {
  StandardNotFoundException,
  StandardHasChildrenException,
} from '../exceptions'
import {
  TemplateNotFoundException,
  TemplateNotEditableException,
} from '../../templates/exceptions'

@Injectable()
export class StandardValidator {
  constructor(
    @Inject(STANDARDS_REPOSITORY)
    private readonly standardsRepository: StandardsRepository,
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templatesRepository: TemplatesRepository,
  ) {}

  /**
   * Valida que un standard existe y lo retorna
   *
   * @param standardId - ID del standard
   * @returns Standard encontrado
   * @throws {StandardNotFoundException} Si el standard no existe
   */
  async validateAndGetStandard(standardId: string): Promise<StandardEntity> {
    const standard = await this.standardsRepository.findById(standardId)

    if (!standard) {
      throw new StandardNotFoundException(standardId)
    }

    return standard
  }

  /**
   * Valida que un template existe, es editable y lo retorna
   *
   * @param templateId - ID del template
   * @returns Template encontrado
   * @throws {TemplateNotFoundException} Si el template no existe
   * @throws {TemplateNotEditableException} Si el template no es editable
   */
  async validateAndGetEditableTemplate(
    templateId: string,
  ): Promise<TemplateEntity> {
    const template = await this.templatesRepository.findById(templateId)

    if (!template) {
      throw new TemplateNotFoundException(templateId)
    }

    if (!template.isEditable) {
      throw new TemplateNotEditableException(template.name || templateId)
    }

    return template
  }

  /**
   * Valida que un standard padre existe y retorna su nivel
   *
   * @param parentId - ID del standard padre
   * @returns Nivel del padre (para calcular nivel del hijo)
   * @throws {StandardNotFoundException} Si el padre no existe
   */
  async validateParentAndGetLevel(parentId: string): Promise<number> {
    const parent = await this.standardsRepository.findById(parentId)

    if (!parent) {
      throw new StandardNotFoundException(parentId)
    }

    return parent.level
  }

  /**
   * Valida que un standard no tiene hijos (antes de eliminarlo)
   *
   * @param standardId - ID del standard
   * @throws {StandardHasChildrenException} Si el standard tiene hijos
   */
  async validateHasNoChildren(standardId: string): Promise<void> {
    const childCount = await this.standardsRepository.countChildren(standardId)

    if (childCount > 0) {
      throw new StandardHasChildrenException(standardId, childCount)
    }
  }

  /**
   * Valida que un código es único dentro del template
   *
   * @param templateId - ID del template
   * @param code - Código del standard
   * @param excludeId - ID del standard a excluir (para updates)
   */
  async validateUniqueCode(
    templateId: string,
    code: string,
    excludeId?: string,
  ): Promise<void> {
    const exists = await this.standardsRepository.existsByCodeInTemplate(
      templateId,
      code,
      excludeId,
    )

    if (exists) {
      throw new Error(
        `Standard with code '${code}' already exists in this template`,
      )
    }
  }
}

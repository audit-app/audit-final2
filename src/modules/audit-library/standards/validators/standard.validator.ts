import { Injectable, Inject } from '@nestjs/common'
import { StandardEntity } from '../entities'
import {
  StandardNotFoundException,
  StandardHasChildrenException,
  StandardRepeatCodeException,
  StandardCannotModifyStructureException,
  StandardCannotModifyContentException,
  StandardWithChildrenCannotBeAuditableException,
} from '../exceptions'
import { TemplateNotFoundException } from '../../templates/exceptions'
import { STANDARDS_REPOSITORY } from '../tokens'
import { TEMPLATES_REPOSITORY } from '../../templates/tokens'
import type { IStandardsRepository } from '../repositories'
import type { ITemplatesRepository } from '../../templates/repositories'

@Injectable()
export class StandardValidator {
  constructor(
    @Inject(STANDARDS_REPOSITORY)
    private readonly standardsRepository: IStandardsRepository,
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templatesRepository: ITemplatesRepository,
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
      throw new StandardRepeatCodeException(code)
    }
  }

  /**
   * Valida que se puede modificar la estructura del template
   * (agregar, eliminar, reordenar standards)
   *
   * Solo permitido cuando el template está en estado DRAFT
   *
   * @param templateId - ID del template
   * @throws {TemplateNotFoundException} Si el template no existe
   * @throws {StandardCannotModifyStructureException} Si no se puede modificar la estructura
   */
  async validateCanModifyStructure(templateId: string): Promise<void> {
    const template = await this.templatesRepository.findById(templateId)

    if (!template) {
      throw new TemplateNotFoundException(templateId)
    }

    if (!template.canModifyStructure) {
      throw new StandardCannotModifyStructureException(
        template.name,
        template.status,
      )
    }
  }

  /**
   * Valida que se puede modificar el contenido del template
   * (editar textos: code, title, description)
   *
   * Permitido cuando el template está en DRAFT o PUBLISHED
   * (para corregir typos en templates publicados)
   *
   * @param templateId - ID del template
   * @throws {TemplateNotFoundException} Si el template no existe
   * @throws {StandardCannotModifyContentException} Si no se puede modificar el contenido
   */
  async validateCanModifyContent(templateId: string): Promise<void> {
    const template = await this.templatesRepository.findById(templateId)

    if (!template) {
      throw new TemplateNotFoundException(templateId)
    }

    if (!template.canModifyContent) {
      throw new StandardCannotModifyContentException(
        template.name,
        template.status,
      )
    }
  }

  /**
   * Valida que un standard puede ser marcado como auditable
   *
   * Regla: Los standards con hijos NO pueden ser auditables (solo agrupadores)
   *
   * @param standardId - ID del standard
   * @param isAuditable - Nuevo valor de isAuditable
   * @throws {StandardWithChildrenCannotBeAuditableException} Si tiene hijos y se intenta marcar como auditable
   */
  async validateCanBeAuditable(
    standardId: string,
    isAuditable: boolean,
  ): Promise<void> {
    // Solo validar si se intenta marcar como auditable (true)
    if (!isAuditable) {
      return // Permitir marcar como NO auditable siempre
    }

    // Verificar si tiene hijos
    const childCount = await this.standardsRepository.countChildren(standardId)

    if (childCount > 0) {
      throw new StandardWithChildrenCannotBeAuditableException(
        standardId,
        childCount,
      )
    }
  }
}

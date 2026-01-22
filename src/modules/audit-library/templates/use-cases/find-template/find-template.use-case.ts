import { Inject, Injectable } from '@nestjs/common'
import type { TemplateEntity } from '../../entities/template.entity'
import { TEMPLATES_REPOSITORY } from '../../tokens'
import type { ITemplatesRepository } from '../../repositories'
import { TemplateValidator } from '../../validators'

/**
 * Find Template Use Case
 *
 * Obtiene un template por ID con sus standards
 */
@Injectable()
export class FindTemplateUseCase {
  constructor(
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templatesRepository: ITemplatesRepository,
    private readonly templateValidator: TemplateValidator,
  ) {}

  /**
   * Ejecuta la búsqueda del template
   *
   * @param id - ID del template
   * @returns Template encontrado con standards
   * @throws {TemplateNotFoundException} Si el template no existe
   */
  async execute(id: string): Promise<TemplateEntity> {
    return await this.templateValidator.validateAndGetTemplate(id)
  }
}

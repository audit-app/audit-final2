import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import { TemplateNotEditableException } from '../../exceptions'
import { TEMPLATES_REPOSITORY } from '@core'
import type { ITemplatesRepository } from '../../repositories'
import { TemplateEntity } from '../../entities'
import { TemplateFactory } from '../../factories'
import { UpdateTemplateDto } from '../../dtos'
import { TemplateValidator } from '../../validators'

@Injectable()
export class UpdateTemplateUseCase {
  constructor(
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templatesRepository: ITemplatesRepository,
    private readonly templateFactory: TemplateFactory,
    private readonly templateValidator: TemplateValidator,
  ) {}

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
    const template = await this.templateValidator.validateAndGetTemplate(id)
    await this.templateValidator.validateUniqueConstraint(
      template.code,
      template.version,
      id,
    )
    this.templateFactory.updateFromDto(template, dto)
    if (template.isArchived) {
      throw new TemplateNotEditableException(template.name)
    }
    return await this.templatesRepository.save(template)
  }
}

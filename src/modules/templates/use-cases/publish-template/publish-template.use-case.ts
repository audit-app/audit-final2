import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import type { TemplateEntity } from '../../entities/template.entity'
import { TEMPLATES_REPOSITORY } from '@core'
import type { ITemplatesRepository } from '../../repositories'
import { TemplateValidator } from '../../validators/'

@Injectable()
export class PublishTemplateUseCase {
  constructor(
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templatesRepository: ITemplatesRepository,
    private readonly templateValidatator: TemplateValidator,
  ) {}

  /**
   * Ejecuta la publicación del template
   *
   * @param id - ID del template a publicar
   * @returns Template publicado
   * @throws {TemplateNotFoundException} Si el template no existe
   */
  @Transactional()
  async execute(id: string): Promise<TemplateEntity> {
    const template = await this.templateValidatator.validateAndGetTemplate(id)
    template.publish()
    return this.templatesRepository.save(template)
  }
}

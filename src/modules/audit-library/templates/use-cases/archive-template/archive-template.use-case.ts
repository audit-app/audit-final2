import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import type { TemplateEntity } from '../../entities/template.entity'
import { TEMPLATES_REPOSITORY } from '@core'
import type { ITemplatesRepository } from '../../repositories'
import { TemplateValidator } from '../../validators'

@Injectable()
export class ArchiveTemplateUseCase {
  constructor(
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templatesRepository: ITemplatesRepository,
    private readonly templateValidator: TemplateValidator,
  ) {}

  /**
   * Ejecuta el archivado del template
   *
   * @param id - ID del template
   * @returns Template archivado
   * @throws {TemplateNotFoundException} Si el template no existe
   */
  @Transactional()
  async execute(id: string): Promise<TemplateEntity> {
    const template = await this.templateValidator.validateAndGetTemplate(id)
    template.archive()
    return this.templatesRepository.save(template)
  }
}

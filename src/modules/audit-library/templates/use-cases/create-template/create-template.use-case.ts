import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import type { CreateTemplateDto } from '../../dtos/create-template.dto'
import type { TemplateEntity } from '../../entities/template.entity'
import { TemplateFactory } from '../../factories'
import { TEMPLATES_REPOSITORY } from '../../tokens'
import type { ITemplatesRepository } from '../../repositories'
import { TemplateValidator } from '../../validators'

@Injectable()
export class CreateTemplateUseCase {
  constructor(
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templatesRepository: ITemplatesRepository,
    private readonly templateFactory: TemplateFactory,
    private readonly templateValidator: TemplateValidator,
  ) {}

  @Transactional()
  async execute(dto: CreateTemplateDto): Promise<TemplateEntity> {
    await this.templateValidator.validateUniqueConstraint(dto.code, dto.version)
    const template = this.templateFactory.createFromDto(dto)
    return await this.templatesRepository.save(template)
  }
}

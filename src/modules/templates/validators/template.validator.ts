import { Injectable, Inject } from '@nestjs/common'
import type { ITemplatesRepository } from '../repositories'
import { TemplateEntity } from '../entities'
import { TEMPLATES_REPOSITORY } from '@core'
import {
  TemplateAlreadyExistsException,
  TemplateNotFoundException,
} from '../exceptions'

@Injectable()
export class TemplateValidator {
  constructor(
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templateRepository: ITemplatesRepository,
  ) {}

  async validateUniqueConstraint(
    code: string,
    version: string,
    excludeId?: string,
  ): Promise<void> {
    const exists = await this.templateRepository.existsByCodeAndVersion(
      code,
      version,
      excludeId,
    )
    if (exists) {
      throw new TemplateAlreadyExistsException(code, version)
    }
  }

  async validateAndGetTemplate(templateId: string): Promise<TemplateEntity> {
    const template = await this.templateRepository.findById(templateId)

    if (!template) {
      throw new TemplateNotFoundException(templateId)
    }

    return template
  }
}

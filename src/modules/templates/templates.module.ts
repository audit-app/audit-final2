import { Module } from '@nestjs/common'
import { TEMPLATES_REPOSITORY } from '@core'
import { TemplatesRepository } from './repositories/templates.repository'

import {
  CreateTemplateUseCase,
  UpdateTemplateUseCase,
  FindTemplateUseCase,
  FindTemplatesUseCase,
  PublishTemplateUseCase,
  ArchiveTemplateUseCase,
} from './use-cases'

import { TemplatesController } from './controllers/templates.controller'
import { TemplateImportService } from './shared/services/template-import.service'
import { TemplateValidator } from './validators'
import { TemplateFactory } from './factories'

@Module({
  imports: [],
  controllers: [TemplatesController],
  providers: [
    // Alias: map class to token provided by @core/persistence
    {
      provide: TemplatesRepository,
      useExisting: TEMPLATES_REPOSITORY,
    },

    TemplateValidator,
    TemplateFactory,
    TemplateImportService,

    // Template Use Cases
    CreateTemplateUseCase,
    UpdateTemplateUseCase,
    FindTemplateUseCase,
    FindTemplatesUseCase,
    PublishTemplateUseCase,
    ArchiveTemplateUseCase,
  ],
  exports: [
    // Export use cases for other modules
    FindTemplateUseCase,
    FindTemplatesUseCase,
    TemplateImportService,
  ],
})
export class TemplatesModule {}

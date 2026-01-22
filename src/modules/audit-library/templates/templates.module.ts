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
  ExportTemplateUseCase,
} from './use-cases'

import { TemplatesController } from './controllers/templates.controller'
import { TemplateValidator } from './validators'
import { TemplateFactory } from './factories'
import { TemplateExportService } from './shared/services'

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
    TemplateExportService,

    // Template Use Cases
    CreateTemplateUseCase,
    UpdateTemplateUseCase,
    FindTemplateUseCase,
    FindTemplatesUseCase,
    PublishTemplateUseCase,
    ArchiveTemplateUseCase,
    ExportTemplateUseCase,
  ],
  exports: [
    // Export use cases for other modules
    FindTemplateUseCase,
    FindTemplatesUseCase,
  ],
})
export class TemplatesModule {}

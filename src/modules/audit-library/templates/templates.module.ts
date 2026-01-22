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
  ImportTemplateUseCase,
} from './use-cases'

import { TemplatesController } from './controllers/templates.controller'
import { TemplateValidator } from './validators'
import { TemplateFactory } from './factories'
import { TemplateExportService, TemplateImportService } from './services'

@Module({
  imports: [],
  controllers: [TemplatesController],
  providers: [
    {
      provide: TemplatesRepository,
      useExisting: TEMPLATES_REPOSITORY,
    },

    TemplateValidator,
    TemplateFactory,
    TemplateExportService,
    TemplateImportService,

    // Template Use Cases
    CreateTemplateUseCase,
    UpdateTemplateUseCase,
    FindTemplateUseCase,
    FindTemplatesUseCase,
    PublishTemplateUseCase,
    ArchiveTemplateUseCase,
    ExportTemplateUseCase,
    ImportTemplateUseCase,
  ],
  exports: [
    // Export use cases for other modules
    FindTemplateUseCase,
    FindTemplatesUseCase,
  ],
})
export class TemplatesModule {}

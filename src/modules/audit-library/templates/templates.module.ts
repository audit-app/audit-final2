import { Module } from '@nestjs/common'
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
import {
  TemplateExportService,
  TemplateImportService,
  TemplateExampleService,
} from './services'
import { TEMPLATES_REPOSITORY } from './tokens'
import { StandardsModule } from '../standards/standards.module'

@Module({
  imports: [StandardsModule],
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
    TemplateExampleService,

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

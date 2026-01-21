import { Module } from '@nestjs/common'
import { TemplatesRepository } from './repositories/templates.repository'

import {
  CreateTemplateUseCase,
  UpdateTemplateUseCase,
  FindTemplateUseCase,
  FindTemplatesWithFiltersUseCase,
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
    // Repositories
    TemplatesRepository,
    TemplateValidator,
    TemplateFactory,
    // Services
    TemplateImportService,

    // Template Use Cases
    CreateTemplateUseCase,
    UpdateTemplateUseCase,
    FindTemplateUseCase,
    FindTemplatesWithFiltersUseCase,
    PublishTemplateUseCase,
    ArchiveTemplateUseCase,
  ],
  exports: [
    // Repositories (for other modules, e.g., StandardsModule)
    TemplatesRepository,
    FindTemplateUseCase,
    FindTemplatesWithFiltersUseCase,
    TemplateImportService,
  ],
})
export class TemplatesModule {}

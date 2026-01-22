import { Module } from '@nestjs/common'
import { STANDARDS_REPOSITORY, TEMPLATES_REPOSITORY } from '@core'
import { StandardsRepository } from './repositories/standards.repository'
import { TemplatesRepository } from '../templates/repositories/templates.repository'

// Controllers
import { StandardsController } from './controllers/standards.controller'

// Factories & Validators
import { StandardFactory } from './factories'
import { StandardValidator } from './validators'

// Use Cases
import {
  CreateStandardUseCase,
  UpdateStandardUseCase,
  DeleteStandardUseCase,
  FindStandardUseCase,
  ReorderStandardUseCase,
  GetTemplateStandardsTreeUseCase,
  ToggleAuditableUseCase,
} from './use-cases'

@Module({
  imports: [],
  controllers: [StandardsController],
  providers: [
    // Alias: map class to token provided by @core/persistence
    {
      provide: StandardsRepository,
      useExisting: STANDARDS_REPOSITORY,
    },
    {
      provide: TemplatesRepository,
      useExisting: TEMPLATES_REPOSITORY,
    },

    StandardFactory,
    StandardValidator,

    // Use Cases
    CreateStandardUseCase,
    UpdateStandardUseCase,
    DeleteStandardUseCase,
    GetTemplateStandardsTreeUseCase,
    FindStandardUseCase,
    ReorderStandardUseCase,
    ToggleAuditableUseCase,
  ],
  exports: [],
})
export class StandardsModule {}

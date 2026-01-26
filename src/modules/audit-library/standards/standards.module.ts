import { Module } from '@nestjs/common'
import { StandardsController } from './controllers/standards.controller'
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
  ActivateAuditableUseCase,
  DeactivateAuditableUseCase,
} from './use-cases'

@Module({
  imports: [],
  controllers: [StandardsController],
  providers: [
    StandardFactory,
    StandardValidator,

    // Use Cases
    CreateStandardUseCase,
    UpdateStandardUseCase,
    DeleteStandardUseCase,
    GetTemplateStandardsTreeUseCase,
    FindStandardUseCase,
    ReorderStandardUseCase,
    ActivateAuditableUseCase,
    DeactivateAuditableUseCase,
  ],
  exports: [],
})
export class StandardsModule {}

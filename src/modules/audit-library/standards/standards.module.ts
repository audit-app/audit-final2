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
  ToggleAuditableUseCase,
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
    ToggleAuditableUseCase,
  ],
  exports: [],
})
export class StandardsModule {}

import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Import TemplatesModule to access TemplatesRepository
import { TemplatesModule } from '../templates/templates.module'

// Entities
import { StandardEntity } from './entities/standard.entity'

// Repositories
import { StandardsRepository } from './repositories/standards.repository'

// Controllers
import { StandardsController } from './controllers/standards.controller'

// Use Cases
import {
  CreateStandardUseCase,
  UpdateStandardUseCase,
  DeleteStandardUseCase,
  FindStandardUseCase,
  FindAllStandardsUseCase,
  FindStandardsByTemplateUseCase,
  FindStandardsTreeUseCase,
  FindStandardChildrenUseCase,
  FindAuditableStandardsUseCase,
  ActivateStandardUseCase,
  DeactivateStandardUseCase,
} from './use-cases'

@Module({
  imports: [
    TypeOrmModule.forFeature([StandardEntity]),
    forwardRef(() => TemplatesModule), // Use forwardRef to break circular dependency
  ],
  controllers: [StandardsController],
  providers: [
    // Repository
    StandardsRepository,

    // Use Cases
    CreateStandardUseCase,
    UpdateStandardUseCase,
    DeleteStandardUseCase,
    FindStandardUseCase,
    FindAllStandardsUseCase,
    FindStandardsByTemplateUseCase,
    FindStandardsTreeUseCase,
    FindStandardChildrenUseCase,
    FindAuditableStandardsUseCase,
    ActivateStandardUseCase,
    DeactivateStandardUseCase,
  ],
  exports: [
    // Export repository for other modules if needed
    StandardsRepository,

    // Export use cases that other modules might need
    FindStandardsByTemplateUseCase,
    FindStandardsTreeUseCase,
  ],
})
export class StandardsModule {}

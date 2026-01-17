import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { TemplateEntity } from './entities/template.entity'
import { StandardEntity } from './entities/standard.entity'

// Repositories
import { TemplatesRepository } from './repositories/templates.repository'
import { StandardsRepository } from './repositories/standards.repository'

// Use Cases - Templates
import {
  CreateTemplateUseCase,
  UpdateTemplateUseCase,
  DeleteTemplateUseCase,
  FindTemplateUseCase,
  FindTemplatesUseCase,
  FindTemplatesWithFiltersUseCase,
  PublishTemplateUseCase,
  ArchiveTemplateUseCase,
  CloneTemplateUseCase,
} from './use-cases/templates'

// Use Cases - Standards
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
} from './use-cases/standards'

// Controllers
import { TemplatesController } from './controllers/templates.controller'
import { StandardsController } from './controllers/standards.controller'

// Services
import { TemplateImportService } from './services/template-import.service'

@Module({
  imports: [TypeOrmModule.forFeature([TemplateEntity, StandardEntity])],
  controllers: [TemplatesController, StandardsController],
  providers: [
    // Repositories
    TemplatesRepository,
    StandardsRepository,

    // Services
    TemplateImportService,

    // Template Use Cases
    CreateTemplateUseCase,
    UpdateTemplateUseCase,
    DeleteTemplateUseCase,
    FindTemplateUseCase,
    FindTemplatesUseCase,
    FindTemplatesWithFiltersUseCase,
    PublishTemplateUseCase,
    ArchiveTemplateUseCase,
    CloneTemplateUseCase,

    // Standard Use Cases
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
    // Repositories (por si otros módulos los necesitan)
    TemplatesRepository,
    StandardsRepository,

    // Use Cases (por si otros módulos los necesitan)
    FindTemplateUseCase,
    FindTemplatesUseCase,
    FindTemplatesWithFiltersUseCase,
    FindStandardsByTemplateUseCase,
    FindStandardsTreeUseCase,
  ],
})
export class TemplatesModule {}

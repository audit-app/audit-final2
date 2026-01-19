import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { TemplateEntity } from './entities/template.entity'

// Repositories
import { TemplatesRepository } from './repositories/templates.repository'

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

// Controllers
import { TemplatesController } from './controllers/templates.controller'

// Services
import { TemplateImportService } from './shared/services/template-import.service'

// Import StandardsModule to access StandardsRepository (circular dependency)
import { StandardsModule } from '../standards/standards.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([TemplateEntity]),
    forwardRef(() => StandardsModule), // Use forwardRef to break circular dependency
  ],
  controllers: [TemplatesController],
  providers: [
    // Repositories
    TemplatesRepository,

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
  ],
  exports: [
    // Repositories (for other modules, e.g., StandardsModule)
    TemplatesRepository,

    // Use Cases (for other modules if needed)
    FindTemplateUseCase,
    FindTemplatesUseCase,
    FindTemplatesWithFiltersUseCase,

    // Services (for StandardsModule to use)
    TemplateImportService,
  ],
})
export class TemplatesModule {}

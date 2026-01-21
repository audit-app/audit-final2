import { Module } from '@nestjs/common'
import { FRAMEWORKS_REPOSITORY } from './tokens'
import { MaturityFrameworksRepository } from './repositories'
import { MaturityFrameworksController } from './controllers/maturity-frameworks.controller'
import { MaturityFrameworkFactory } from './factories'

// Use Cases
import {
  CreateFrameworkUseCase,
  UpdateFrameworkUseCase,
  FindFrameworkUseCase,
  FindFrameworksUseCase,
  DeleteFrameworkUseCase,
  ActivateFrameworkUseCase,
} from './use-cases/frameworks'

/**
 * Frameworks Module
 *
 * Submódulo de MaturityModule para gestión de frameworks de madurez
 * (COBIT 5, CMMI, ISO/IEC 15504, etc.)
 *
 * Responsabilidades:
 * - CRUD de frameworks
 * - Activación/desactivación
 * - Consultas y filtros
 */
@Module({
  imports: [],
  controllers: [MaturityFrameworksController],
  providers: [
    // Alias: map class to token provided by @core/persistence
    {
      provide: MaturityFrameworksRepository,
      useExisting: FRAMEWORKS_REPOSITORY,
    },

    MaturityFrameworkFactory,

    // Use Cases
    CreateFrameworkUseCase,
    UpdateFrameworkUseCase,
    FindFrameworkUseCase,
    FindFrameworksUseCase,
    DeleteFrameworkUseCase,
    ActivateFrameworkUseCase,
  ],
  exports: [
    // Export repository for LevelsModule
    MaturityFrameworksRepository,
    // Export use cases for LevelsModule and other modules
    FindFrameworkUseCase,
    FindFrameworksUseCase,
  ],
})
export class FrameworksModule {}

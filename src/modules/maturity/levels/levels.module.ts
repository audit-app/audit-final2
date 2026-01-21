import { Module } from '@nestjs/common'
import { LEVELS_REPOSITORY } from './tokens'
import { MaturityLevelsRepository } from './repositories'
import { MaturityLevelsController } from './controllers/maturity-levels.controller'
import { MaturityLevelFactory } from './factories'

// Import FrameworksModule to use its services
import { FrameworksModule } from '../frameworks/frameworks.module'

// Use Cases
import {
  CreateLevelUseCase,
  UpdateLevelUseCase,
  DeleteLevelUseCase,
  FindLevelsByFrameworkUseCase,
  BulkCreateLevelsUseCase,
} from './use-cases/levels'

/**
 * Levels Module
 *
 * Submódulo de MaturityModule para gestión de niveles de madurez
 *
 * Responsabilidades:
 * - CRUD de niveles
 * - Asociación con frameworks
 * - Creación en lote (bulk)
 * - Consultas por framework
 *
 * Relación con FrameworksModule:
 * - Importa FrameworksModule para validar frameworks
 * - Usa FindFrameworkUseCase para verificar existencia
 */
@Module({
  imports: [
    FrameworksModule, // ✅ Puede usar servicios de Frameworks!
  ],
  controllers: [MaturityLevelsController],
  providers: [
    // Alias: map class to token provided by @core/persistence
    {
      provide: MaturityLevelsRepository,
      useExisting: LEVELS_REPOSITORY,
    },

    MaturityLevelFactory,

    // Use Cases
    CreateLevelUseCase,
    UpdateLevelUseCase,
    DeleteLevelUseCase,
    FindLevelsByFrameworkUseCase,
    BulkCreateLevelsUseCase,
  ],
  exports: [
    // Export use cases for other modules
    FindLevelsByFrameworkUseCase,
  ],
})
export class LevelsModule {}

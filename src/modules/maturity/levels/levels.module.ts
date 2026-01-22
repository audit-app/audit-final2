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

@Module({
  imports: [FrameworksModule],
  controllers: [MaturityLevelsController],
  providers: [
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
  exports: [FindLevelsByFrameworkUseCase],
})
export class LevelsModule {}

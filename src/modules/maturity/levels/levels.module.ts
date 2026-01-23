import { Module } from '@nestjs/common'
import { LEVELS_REPOSITORY } from './tokens'
import { MaturityLevelsRepository } from './repositories'
import { MaturityLevelsController } from './controllers/maturity-levels.controller'
import { MaturityLevelFactory } from './factories'

// Import FrameworksModule to use its services
import { FrameworksModule } from '../frameworks/frameworks.module'

// Use Cases
import {
  UpdateLevelUseCase,
  FindLevelUseCase,
  FindLevelsByFrameworkUseCase,
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

    // Use Cases - Solo se permite consultar y editar (no crear ni eliminar)
    UpdateLevelUseCase,
    FindLevelUseCase,
    FindLevelsByFrameworkUseCase,
  ],
  exports: [FindLevelsByFrameworkUseCase],
})
export class LevelsModule {}

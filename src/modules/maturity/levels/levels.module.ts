import { Module } from '@nestjs/common'

import { MaturityLevelsController } from './controllers/maturity-levels.controller'
import { MaturityLevelFactory } from './factories'

// Use Cases
import {
  UpdateLevelUseCase,
  FindLevelUseCase,
  FindLevelsByFrameworkUseCase,
} from './use-cases/levels'

@Module({
  imports: [],
  controllers: [MaturityLevelsController],
  providers: [
    MaturityLevelFactory,

    UpdateLevelUseCase,
    FindLevelUseCase,
    FindLevelsByFrameworkUseCase,
  ],
  exports: [MaturityLevelFactory],
})
export class LevelsModule {}

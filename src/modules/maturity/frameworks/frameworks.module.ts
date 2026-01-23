import { Module } from '@nestjs/common'
import { MaturityFrameworksController } from './controllers/frameworks.controller'
import { FrameworkFactory } from './factories'

// Use Cases
import {
  CreateFrameworkUseCase,
  UpdateFrameworkUseCase,
  FindFrameworkUseCase,
  FindFrameworksUseCase,
  DeleteFrameworkUseCase,
  ActivateFrameworkUseCase,
} from './use-cases'
import { FrameworkDomainValidator, LevelSequenceValidator } from './validators'
import { LevelsModule } from '../levels'

@Module({
  imports: [LevelsModule],
  controllers: [MaturityFrameworksController],
  providers: [
    FrameworkFactory,
    LevelSequenceValidator,
    FrameworkDomainValidator,
    CreateFrameworkUseCase,
    UpdateFrameworkUseCase,
    FindFrameworkUseCase,
    FindFrameworksUseCase,
    DeleteFrameworkUseCase,
    ActivateFrameworkUseCase,
  ],
  exports: [],
})
export class FrameworksModule {}

import { Module } from '@nestjs/common'
import { FrameworksModule } from './frameworks/frameworks.module'
import { LevelsModule } from './levels/levels.module'

@Module({
  imports: [FrameworksModule, LevelsModule],
  exports: [FrameworksModule, LevelsModule],
})
export class MaturityModule {}

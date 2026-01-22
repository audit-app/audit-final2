import { Module } from '@nestjs/common'
import { LEVELS_REPOSITORY } from './tokens'
import { MaturityLevelsRepository } from './repositories'
import { MaturityLevelsController } from './controllers/maturity-levels.controller'
import { MaturityLevelFactory } from './factories'

// Import FrameworksModule to use its services
import { FrameworksModule } from '../frameworks/frameworks.module'

// Use Cases
import {
  // CreateLevelUseCase, // ❌ ELIMINADO - No se permite crear levels sueltos
  UpdateLevelUseCase,
  // DeleteLevelUseCase, // ❌ ELIMINADO - No se permite eliminar levels individuales
  FindLevelUseCase, // ✅ PERMITIDO - Obtener un level por ID
  FindLevelsByFrameworkUseCase,
  // BulkCreateLevelsUseCase, // ❌ ELIMINADO - No se necesita bulk replace
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

    // Use Cases (solo los necesarios después del rediseño)
    // CreateLevelUseCase, // ❌ ELIMINADO - Levels se crean solo con el framework
    UpdateLevelUseCase, // ✅ PERMITIDO - Editar texto, colores, recomendaciones
    // DeleteLevelUseCase, // ❌ ELIMINADO - No se permite eliminar levels individuales
    FindLevelUseCase, // ✅ PERMITIDO - Obtener un level por ID
    FindLevelsByFrameworkUseCase, // ✅ PERMITIDO - Listar levels de un framework
    // BulkCreateLevelsUseCase, // ❌ ELIMINADO - No se necesita reemplazar en lote
  ],
  exports: [FindLevelsByFrameworkUseCase],
})
export class LevelsModule {}

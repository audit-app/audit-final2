import { Module } from '@nestjs/common'
import { FrameworksModule } from './frameworks/frameworks.module'
import { LevelsModule } from './levels/levels.module'

/**
 * Maturity Module
 *
 * Módulo principal que agrupa submódulos de frameworks y levels.
 *
 * Submódulos:
 * - FrameworksModule: Gestión de frameworks de madurez (COBIT, CMMI, etc.)
 * - LevelsModule: Gestión de niveles de madurez
 *
 * Arquitectura:
 * ```
 * MaturityModule
 * ├── FrameworksModule
 * │   ├── controllers/
 * │   ├── use-cases/
 * │   ├── repositories/
 * │   └── ...
 * ├── LevelsModule
 * │   ├── controllers/
 * │   ├── use-cases/
 * │   ├── repositories/
 * │   └── ...
 * └── shared/          # Recursos compartidos (futuro)
 *     ├── validators/
 *     └── utils/
 * ```
 *
 * Beneficios:
 * - ✅ Código organizado por dominio
 * - ✅ Submódulos independientes pero relacionados
 * - ✅ LevelsModule puede importar FrameworksModule
 * - ✅ Recursos compartidos en /shared
 * - ✅ Fácil de mantener y escalar
 */
@Module({
  imports: [
    FrameworksModule,
    LevelsModule,
  ],
  exports: [
    FrameworksModule,  // Exportar para que otros módulos usen
    LevelsModule,      // Exportar para que otros módulos usen
  ],
})
export class MaturityModule {}

import { Module } from '@nestjs/common'
import { TemplatesModule } from '../audit-library/templates/templates.module'
import { NavigationController } from './controllers'
import {
  GetStaticNavigationUseCase,
  GetDynamicTemplatesUseCase,
  GetMenuUseCase,
} from './use-cases'

/**
 * Navigation Module
 *
 * Módulo para gestionar la navegación del sidebar
 *
 * Características:
 * - Navegación estática según roles (módulos del sistema)
 * - Navegación dinámica (plantillas publicadas)
 * - Endpoint GET /navigation/menu que retorna todo
 *
 * Separado de permisos (Casbin) para mantener responsabilidades claras:
 * - Navigation: ¿Qué ve en el menú?
 * - Casbin: ¿Qué puede hacer?
 */
@Module({
  imports: [
    // Importar TemplatesModule para acceder al repositorio
    TemplatesModule,
  ],
  controllers: [NavigationController],
  providers: [
    GetStaticNavigationUseCase,
    GetDynamicTemplatesUseCase,
    GetMenuUseCase,
  ],
  exports: [GetMenuUseCase],
})
export class NavigationModule {}

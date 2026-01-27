import { Injectable } from '@nestjs/common'
import { Role } from '../../users/entities/user.entity'
import { MenuResponseDto } from '../dtos'
import { GetStaticNavigationUseCase } from './get-static-navigation.use-case'
import { GetDynamicTemplatesUseCase } from './get-dynamic-templates.use-case'

/**
 * Get Menu Use Case
 *
 * Retorna el menú completo de navegación (estático + dinámico)
 */
@Injectable()
export class GetMenuUseCase {
  constructor(
    private readonly getStaticNavigationUseCase: GetStaticNavigationUseCase,
    private readonly getDynamicTemplatesUseCase: GetDynamicTemplatesUseCase,
  ) {}

  /**
   * Ejecuta la obtención del menú completo
   *
   * @param roles - Roles del usuario autenticado
   * @returns Menú completo con navegación estática y plantillas dinámicas integradas
   */
  async execute(roles: Role[]): Promise<MenuResponseDto> {
    // Obtener navegación estática según rol
    const staticNavigation = this.getStaticNavigationUseCase.execute(roles)

    // Obtener plantillas dinámicas
    const dynamicTemplates = await this.getDynamicTemplatesUseCase.execute()

    // Combinar navegación estática + plantillas dinámicas
    const navMain = this.combineNavigation(staticNavigation, dynamicTemplates)

    return {
      navMain,
    }
  }

  /**
   * Combina navegación estática con plantillas dinámicas
   *
   * Inserta las plantillas dinámicas como sub-items del item "Controles"
   * Si no existe el item "Controles", lo agrega al final
   *
   * @param staticNav - Items de navegación estática
   * @param templates - Plantillas dinámicas
   * @returns Navegación combinada
   */
  private combineNavigation(staticNav: any[], templates: any[]): any[] {
    // Buscar el item "Controles" en la navegación estática
    const controlesItemIndex = staticNav.findIndex(
      (item) =>
        item.title === 'Controles' ||
        item.url?.includes('/standards') ||
        item.url?.includes('/controls'),
    )

    if (controlesItemIndex >= 0) {
      // Si existe el item "Controles", agregar las plantillas como sub-items
      const updatedItem = {
        ...staticNav[controlesItemIndex],
        items: templates.length > 0 ? templates : undefined,
      }

      // Crear copia del array con el item actualizado
      return [
        ...staticNav.slice(0, controlesItemIndex),
        updatedItem,
        ...staticNav.slice(controlesItemIndex + 1),
      ]
    } else {
      // Si no existe, crear un nuevo item "Controles" con las plantillas
      const controlesItem = {
        title: 'Controles',
        description: 'Controles y estándares por plantilla',
        url: '/admin/standards',
        icon: 'files',
        type: 'static' as const,
        order: 100,
        items: templates.length > 0 ? templates : undefined,
      }

      return [...staticNav, controlesItem]
    }
  }
}

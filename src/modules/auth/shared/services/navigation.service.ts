import { Injectable } from '@nestjs/common'
import { Role } from '../../../users/entities/user.entity'
import { NavigationItemDto } from '../dtos/navigation-item.dto'
import { getNavigationForRole } from '../config/navigation.config'

/**
 * Servicio de Navegación
 *
 * Responsabilidades:
 * - Obtener rutas de navegación según el rol del usuario
 * - Filtrar rutas según permisos adicionales (futuro)
 * - Aplicar lógica de negocio sobre las rutas
 */
@Injectable()
export class NavigationService {
  /**
   * Obtiene las rutas de navegación para un usuario
   *
   * Si el usuario tiene múltiples roles, combina las rutas de todos ellos
   * y elimina duplicados por URL
   *
   * @param roles - Array de roles del usuario
   * @returns Array de items de navegación
   */
  getNavigationForUser(roles: Role[]): NavigationItemDto[] {
    // Si no tiene roles, devolver array vacío
    if (!roles || roles.length === 0) {
      return []
    }

    // Si tiene un solo rol, devolver directamente las rutas
    if (roles.length === 1) {
      return getNavigationForRole(roles[0])
    }

    // Si tiene múltiples roles, combinar rutas y eliminar duplicados
    const allRoutes: NavigationItemDto[] = []
    const seenUrls = new Set<string>()

    for (const role of roles) {
      const routes = getNavigationForRole(role)

      for (const route of routes) {
        // Si ya vimos esta URL, saltar
        if (seenUrls.has(route.url)) {
          continue
        }

        seenUrls.add(route.url)
        allRoutes.push(route)
      }
    }

    // Ordenar por order
    return allRoutes.sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  /**
   * Obtiene las rutas de navegación para un rol específico
   *
   * @param role - Rol del usuario
   * @returns Array de items de navegación
   */
  getNavigationForRole(role: Role): NavigationItemDto[] {
    return getNavigationForRole(role)
  }

  /**
   * Filtra rutas según permisos adicionales (futuro)
   *
   * Esta función podría integrarse con el módulo de autorización
   * para filtrar rutas según permisos granulares de Casbin
   *
   * @param routes - Rutas a filtrar
   * @param userId - ID del usuario
   * @returns Rutas filtradas
   */
  async filterByPermissions(
    routes: NavigationItemDto[],
    userId: string,
  ): Promise<NavigationItemDto[]> {
    // TODO: Implementar filtrado por permisos de Casbin
    // Por ahora, devolver todas las rutas
    return routes
  }
}

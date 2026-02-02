import { Injectable } from '@nestjs/common'
import { Role } from '@core'
import { NavigationItemDto } from '../dtos'
import { getStaticNavigationForRole } from '../constants'

/**
 * Get Static Navigation Use Case
 *
 * Retorna la navegación estática (módulos del sistema) según el rol del usuario
 */
@Injectable()
export class GetStaticNavigationUseCase {
  /**
   * Ejecuta la obtención de navegación estática
   *
   * @param roles - Roles del usuario autenticado
   * @returns Items de navegación estáticos ordenados
   */
  execute(roles: Role[]): NavigationItemDto[] {
    // Si el usuario tiene múltiples roles, usamos el de mayor jerarquía
    // Jerarquía: ADMIN > GERENTE > AUDITOR > CLIENTE
    const roleHierarchy = [Role.ADMIN, Role.GERENTE, Role.AUDITOR, Role.CLIENTE]
    const highestRole =
      roleHierarchy.find((role) => roles.includes(role)) || Role.CLIENTE

    return getStaticNavigationForRole(highestRole)
  }
}

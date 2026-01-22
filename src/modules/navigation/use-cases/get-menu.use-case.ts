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
   * @returns Menú completo con navegación estática y dinámica
   */
  async execute(roles: Role[]): Promise<MenuResponseDto> {
    // Obtener navegación estática según rol
    const staticNavigation = this.getStaticNavigationUseCase.execute(roles)

    // Obtener plantillas dinámicas
    const dynamicTemplates = await this.getDynamicTemplatesUseCase.execute()

    return {
      static: staticNavigation,
      dynamic: dynamicTemplates,
    }
  }
}

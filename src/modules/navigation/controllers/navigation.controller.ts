import { Controller, Get, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/shared/guards/jwt-auth.guard'
import { MenuResponseDto } from '../dtos'
import { GetMenuUseCase } from '../use-cases'

/**
 * Navigation Controller
 *
 * Endpoints para obtener el menú de navegación según el usuario autenticado
 */
@ApiTags('navigation')
@Controller('navigation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NavigationController {
  constructor(private readonly getMenuUseCase: GetMenuUseCase) {}

  /**
   * GET /navigation/menu
   *
   * Obtiene el menú completo de navegación (estático + dinámico)
   */
  @Get('menu')
  @ApiOperation({
    summary: 'Obtener menú de navegación completo',
    description:
      'Retorna la navegación estática (módulos según rol) y dinámica (plantillas disponibles). ' +
      'El menú se personaliza según los roles del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Menú obtenido exitosamente',
    type: MenuResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
  })
  async getMenu(@Request() req: any): Promise<MenuResponseDto> {
    const userRoles = req.user.roles || []
    return await this.getMenuUseCase.execute(userRoles)
  }
}

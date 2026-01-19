import { ApiProperty } from '@nestjs/swagger'
import { UserResponseDto } from '../../../users/dtos/user-response.dto'
import { NavigationItemDto } from '../../shared/dtos'

/**
 * DTO de respuesta para el endpoint GET /auth/me
 *
 * Extiende UserResponseDto agregando rutas de navegación
 * basadas en el rol del usuario
 */
export class MeResponseDto extends UserResponseDto {
  @ApiProperty({
    description: 'Rutas de navegación disponibles según el rol del usuario',
    type: [NavigationItemDto],
    example: [
      {
        title: 'Dashboard',
        description: 'Panel de control',
        url: '/dashboard',
        icon: 'home',
        order: 1,
      },
      {
        title: 'Usuarios',
        description: 'Gestión de usuarios',
        url: '/admin/users',
        icon: 'users',
        order: 2,
      },
    ],
  })
  navigation: NavigationItemDto[]
}

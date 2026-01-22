import { ApiProperty } from '@nestjs/swagger'
import { NavigationItemDto } from './navigation-item.dto'

/**
 * Respuesta completa del menú de navegación
 *
 * Incluye navegación estática y dinámica
 */
export class MenuResponseDto {
  @ApiProperty({
    description: 'Items de navegación estáticos (módulos del sistema)',
    type: [NavigationItemDto],
  })
  static: NavigationItemDto[]

  @ApiProperty({
    description: 'Items de navegación dinámicos (plantillas del usuario)',
    type: [NavigationItemDto],
  })
  dynamic: NavigationItemDto[]
}

import { ApiProperty } from '@nestjs/swagger'
import { NavigationItemDto } from './navigation-item.dto'

/**
 * Respuesta completa del menú de navegación
 *
 * Incluye navegación estática y dinámica combinadas en un solo array
 */
export class MenuResponseDto {
  @ApiProperty({
    description:
      'Items del menú principal (combina navegación estática y dinámica)',
    type: [NavigationItemDto],
    example: [
      {
        title: 'Home',
        url: '/',
        icon: 'home',
      },
      {
        title: 'Usuarios',
        url: '/admin/users',
        icon: 'users',
      },
      {
        title: 'Frameworks',
        url: '/admin/frameworks',
        icon: 'layers',
      },
      {
        title: 'Plantillas',
        url: '/admin/templates',
        icon: 'folder',
      },
      {
        title: 'Controles',
        url: '/admin/standards',
        icon: 'files',
        items: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'ISO 27001',
            url: '/admin/templates/550e8400-e29b-41d4-a716-446655440000',
            icon: 'file-text',
            badge: '1.0',
          },
          {
            id: '661e9511-f39c-52e5-b827-557766551111',
            title: 'COBIT 5',
            url: '/admin/templates/661e9511-f39c-52e5-b827-557766551111',
            icon: 'file-text',
            badge: '2.0',
          },
        ],
      },
    ],
  })
  navMain: NavigationItemDto[]
}

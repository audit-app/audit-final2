import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO que representa un item del menú de navegación (sidebar)
 *
 * Estructura jerárquica que permite menús multinivel
 */
export class NavigationItemDto {
  @ApiProperty({
    description: 'Título del item del menú',
    example: 'Dashboard',
  })
  title: string

  @ApiProperty({
    description: 'Descripción del item (opcional)',
    example: 'Panel de control principal',
    required: false,
  })
  description?: string

  @ApiProperty({
    description: 'URL/ruta del item',
    example: '/dashboard',
  })
  url: string

  @ApiProperty({
    description: 'Icono del item (nombre de icono de la librería del frontend)',
    example: 'home',
    required: false,
  })
  icon?: string

  @ApiProperty({
    description: 'Items hijos (para menús multinivel)',
    type: [NavigationItemDto],
    required: false,
  })
  children?: NavigationItemDto[]

  @ApiProperty({
    description: 'Badge/contador (ej: notificaciones pendientes)',
    example: '5',
    required: false,
  })
  badge?: string

  @ApiProperty({
    description: 'Color del badge',
    example: 'danger',
    required: false,
  })
  badgeVariant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'

  @ApiProperty({
    description: 'Si el item está deshabilitado',
    example: false,
    default: false,
  })
  disabled?: boolean

  @ApiProperty({
    description: 'Orden de visualización',
    example: 1,
    required: false,
  })
  order?: number
}

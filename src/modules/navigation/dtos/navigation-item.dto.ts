import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * DTO que representa un item del menú de navegación (sidebar)
 *
 * Soporta navegación estática (módulos) y dinámica (plantillas con ID)
 */
export class NavigationItemDto {
  @ApiPropertyOptional({
    description: 'ID único del item (solo para navegación dinámica, ej: ID de plantilla)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id?: string

  @ApiProperty({
    description: 'Título del item del menú',
    example: 'ISO 27001',
  })
  title: string

  @ApiPropertyOptional({
    description: 'Descripción del item',
    example: 'Norma de seguridad de la información',
  })
  description?: string

  @ApiProperty({
    description: 'URL/ruta del item',
    example: '/templates/550e8400-e29b-41d4-a716-446655440000',
  })
  url: string

  @ApiPropertyOptional({
    description: 'Icono del item',
    example: 'file-text',
  })
  icon?: string

  @ApiPropertyOptional({
    description: 'Items hijos (para menús multinivel)',
    type: () => [NavigationItemDto],
  })
  children?: NavigationItemDto[]

  @ApiPropertyOptional({
    description: 'Badge/contador (ej: notificaciones pendientes)',
    example: '5',
  })
  badge?: string

  @ApiPropertyOptional({
    description: 'Tipo de item',
    enum: ['static', 'dynamic'],
    example: 'static',
  })
  type?: 'static' | 'dynamic'

  @ApiPropertyOptional({
    description: 'Si el item está deshabilitado',
    example: false,
  })
  disabled?: boolean

  @ApiPropertyOptional({
    description: 'Orden de visualización',
    example: 1,
  })
  order?: number
}

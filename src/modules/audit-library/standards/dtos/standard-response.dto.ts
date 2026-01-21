import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO de respuesta para Standard
 *
 * Usado en las respuestas de API para documentar la estructura en Swagger
 */
export class StandardResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único del estándar',
  })
  id: string

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la plantilla a la que pertenece',
  })
  templateId: string

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del estándar padre (null para nivel raíz)',
    nullable: true,
  })
  parentId: string | null

  @ApiProperty({
    example: 'A.5.1.1',
    description: 'Código único del estándar dentro de la plantilla',
  })
  code: string

  @ApiProperty({
    example: 'Políticas para la seguridad de la información',
    description: 'Título del estándar',
  })
  title: string

  @ApiProperty({
    example: 'Descripción detallada del estándar...',
    description: 'Descripción detallada del estándar',
    nullable: true,
  })
  description: string | null

  @ApiProperty({
    example: 1,
    description: 'Orden de visualización dentro de su nivel',
  })
  order: number

  @ApiProperty({
    example: 3,
    description: 'Nivel en la jerarquía (1 = raíz)',
  })
  level: number

  @ApiProperty({
    example: true,
    description: 'Indica si este estándar es auditable',
  })
  isAuditable: boolean

  @ApiProperty({
    example: '2024-01-20T10:30:00Z',
    description: 'Fecha de creación',
  })
  createdAt: Date

  @ApiProperty({
    example: '2024-06-15T14:45:00Z',
    description: 'Fecha de última actualización',
  })
  updatedAt: Date

  @ApiProperty({
    example: 'user-id-123',
    description: 'ID del usuario que creó el estándar',
    nullable: true,
  })
  createdBy?: string

  @ApiProperty({
    example: 'user-id-456',
    description: 'ID del usuario que actualizó el estándar',
    nullable: true,
  })
  updatedBy?: string
}

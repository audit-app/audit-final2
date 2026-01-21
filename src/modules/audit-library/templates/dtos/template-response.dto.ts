import { ApiProperty } from '@nestjs/swagger'
import { TemplateStatus } from '../constants/template-status.enum'

/**
 * DTO de respuesta para Template
 *
 * Usado en las respuestas de API para documentar la estructura en Swagger
 */
export class TemplateResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único de la plantilla',
  })
  id: string

  @ApiProperty({
    example: 'ISO 27001',
    description: 'Nombre de la plantilla',
  })
  name: string

  @ApiProperty({
    example: 'Sistema de Gestión de Seguridad de la Información',
    description: 'Descripción de la plantilla',
    nullable: true,
  })
  description: string | null

  @ApiProperty({
    example: 'v1.0',
    description: 'Versión de la plantilla',
  })
  version: string

  @ApiProperty({
    enum: TemplateStatus,
    example: TemplateStatus.DRAFT,
    description: 'Estado del ciclo de vida (draft, published, archived)',
  })
  status: TemplateStatus

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
    description: 'ID del usuario que creó la plantilla',
    nullable: true,
  })
  createdBy?: string

  @ApiProperty({
    example: 'user-id-456',
    description: 'ID del usuario que actualizó la plantilla',
    nullable: true,
  })
  updatedBy?: string
}

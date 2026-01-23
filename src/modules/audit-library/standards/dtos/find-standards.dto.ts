import { IsOptional, IsString } from '@core/i18n'
import { IsUUID } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * DTO para obtener estándares de una plantilla específica
 */
export class FindStandardsDto {
  @ApiPropertyOptional({
    description: 'Búsqueda de texto libre en código, nombre o descripción',
    example: 'A.5.1.1',
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({
    description: 'ID de la plantilla (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'El templateId debe ser un UUID válido' })
  templateId: string
}

import { IsUUID, IsOptional, IsInt, Min, Max } from '@core/i18n'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

/**
 * DTO para consultar el historial de auditoría
 */
export class GetAuditHistoryDto {
  @ApiProperty({
    description: 'ID del template (rootId) para obtener todo su historial',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  rootId: string

  @ApiPropertyOptional({
    description: 'Límite de registros a retornar',
    example: 100,
    minimum: 1,
    maximum: 500,
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number
}

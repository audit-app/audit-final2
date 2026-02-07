import { IsOptional, IsBoolean, IsString } from 'class-validator'
import { Transform } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

/**
 * Helper para transformar strings a booleanos en query params
 */
const toBoolean = ({ value }: { value: any }): boolean | undefined => {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

/**
 * DTO para generar reporte de cumplimiento de auditoría
 */
export class GenerateComplianceReportDto {
  @ApiProperty({
    description: 'Incluir gráfica radial de cumplimiento por área',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  includeRadarChart?: boolean = true

  @ApiProperty({
    description: 'Incluir gráfica de barras de ponderaciones',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  includeWeightedBarChart?: boolean = true

  @ApiProperty({
    description: 'Incluir gráfica de dona de niveles de cumplimiento',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  includeComplianceDoughnut?: boolean = true

  @ApiProperty({
    description: 'Incluir gráfica de gauge de cumplimiento global',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  includeGaugeChart?: boolean = true

  @ApiProperty({
    description: 'Incluir tabla detallada de estándares',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  includeDetailedTable?: boolean = true

  @ApiProperty({
    description: 'Incluir hallazgos y recomendaciones',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  includeFindingsAndRecommendations?: boolean = true

  @ApiProperty({
    description: 'Tema del reporte (modern, classic)',
    example: 'modern',
    required: false,
  })
  @IsOptional()
  @IsString()
  theme?: string = 'modern'
}

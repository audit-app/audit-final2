import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  Matches,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * DTO para crear un nivel de madurez dentro de un framework (creación anidada)
 *
 * Este DTO NO incluye frameworkId porque se usa para creación atómica
 * donde los niveles se crean junto con el framework en una sola petición
 */
export class CreateNestedMaturityLevelDto {
  @ApiProperty({
    description: 'Número del nivel de madurez',
    example: 3,
    minimum: 0,
  })
  @IsInt({ message: 'El nivel debe ser un número entero' })
  @Min(0, { message: 'El nivel no puede ser menor a 0' })
  level: number

  @ApiProperty({
    description: 'Nombre completo del nivel',
    example: 'Definido',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string

  @ApiPropertyOptional({
    description: 'Nombre corto/abreviado del nivel',
    example: 'Def',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, {
    message: 'El nombre corto no puede exceder 20 caracteres',
  })
  shortName?: string

  @ApiProperty({
    description: 'Descripción completa del nivel',
    example:
      'Los procesos están documentados, estandarizados e integrados en toda la organización.',
  })
  @IsString()
  @MinLength(10, {
    message: 'La descripción debe tener al menos 10 caracteres',
  })
  description: string

  @ApiProperty({
    description: 'Color en formato hexadecimal',
    example: '#F59E0B',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'El color debe estar en formato hexadecimal válido (ej: #F59E0B)',
  })
  color: string

  @ApiPropertyOptional({
    description: 'Icono o emoji representativo',
    example: '🟡',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'El icono no puede exceder 10 caracteres' })
  icon?: string

  @ApiPropertyOptional({
    description: 'Recomendaciones para alcanzar este nivel',
    example: 'Implementar métricas de rendimiento y monitoreo continuo.',
  })
  @IsOptional()
  @IsString()
  recommendations?: string

  @ApiPropertyOptional({
    description: 'Observaciones típicas en este nivel',
    example: 'Procesos documentados y comunicados mediante capacitación.',
  })
  @IsOptional()
  @IsString()
  observations?: string

  @ApiPropertyOptional({
    description: 'Orden de visualización (si no se especifica, usa el número de nivel)',
    example: 3,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(0, { message: 'El orden no puede ser menor a 0' })
  order?: number

  @ApiPropertyOptional({
    description:
      '🎯 Nivel mínimo sugerido por defecto (defaultMinimum). Útil para pre-llenar configuración de auditoría.',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isMinimumAcceptable?: boolean

  @ApiPropertyOptional({
    description:
      '🎯 Nivel objetivo sugerido por defecto (industryStandard). Útil para pre-llenar configuración de auditoría.',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isTarget?: boolean
}

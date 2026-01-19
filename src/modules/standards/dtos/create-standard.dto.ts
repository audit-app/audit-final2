import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateStandardDto {
  @ApiProperty({
    description: 'ID del template al que pertenece',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'El templateId debe ser un UUID válido' })
  templateId: string

  @ApiPropertyOptional({
    description: 'ID del standard padre (null para nivel raíz)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El parentId debe ser un UUID válido' })
  parentId?: string

  @ApiProperty({
    description: 'Código único del standard',
    example: 'A.5.1.1',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(1, { message: 'El código debe tener al menos 1 caracter' })
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  code: string

  @ApiProperty({
    description: 'Título del standard',
    example: 'Políticas para la seguridad de la información',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @MinLength(2, { message: 'El título debe tener al menos 2 caracteres' })
  @MaxLength(200, { message: 'El título no puede exceder 200 caracteres' })
  title: string

  @ApiPropertyOptional({
    description: 'Descripción detallada',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'La descripción no puede exceder 2000 caracteres',
  })
  description?: string

  @ApiProperty({
    description: 'Orden de visualización',
    example: 1,
    minimum: 0,
  })
  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(0, { message: 'El orden debe ser mayor o igual a 0' })
  order: number

  @ApiPropertyOptional({
    description:
      'Nivel jerárquico (se calcula automáticamente si no se provee)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'El nivel debe ser un número entero' })
  @Min(1, { message: 'El nivel debe ser mayor o igual a 1' })
  level?: number

  @ApiPropertyOptional({
    description: 'Indica si es auditable',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isAuditable?: boolean

  @ApiPropertyOptional({
    description: 'Estado activo/inactivo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

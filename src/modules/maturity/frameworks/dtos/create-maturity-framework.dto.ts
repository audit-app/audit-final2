import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { CreateNestedMaturityLevelDto } from '../../levels/dtos'

/**
 * DTO para crear un framework de madurez
 */
export class CreateMaturityFrameworkDto {
  @ApiProperty({
    description: 'Nombre del framework',
    example: 'COBIT 5',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string

  @ApiProperty({
    description:
      'Código único identificador (solo letras minúsculas, números y guiones)',
    example: 'cobit5',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'El código debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'El código solo puede contener letras minúsculas, números y guiones',
  })
  code: string

  @ApiProperty({
    description: 'Descripción del framework',
    example: 'Framework de gobierno y gestión de TI empresarial',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'La descripción no puede exceder 1000 caracteres',
  })
  description?: string

  @ApiProperty({
    description: 'Nivel mínimo del framework',
    example: 0,
    default: 0,
    minimum: 0,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'El nivel mínimo debe ser un número entero' })
  @Min(0, { message: 'El nivel mínimo no puede ser menor a 0' })
  @Max(10, { message: 'El nivel mínimo no puede ser mayor a 10' })
  minLevel?: number

  @ApiProperty({
    description: 'Nivel máximo del framework',
    example: 5,
    default: 5,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsInt({ message: 'El nivel máximo debe ser un número entero' })
  @Min(1, { message: 'El nivel máximo no puede ser menor a 1' })
  @Max(10, { message: 'El nivel máximo no puede ser mayor a 10' })
  maxLevel?: number

  @ApiProperty({
    description: 'Indica si el framework está activo',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @ApiProperty({
    description:
      'Niveles de madurez del framework (OBLIGATORIO - creación atómica). ' +
      'Los niveles se crean junto con el framework y no se pueden crear por separado. ' +
      'Solo se permite editar los niveles existentes después de crear el framework. ' +
      'IMPORTANTE: La cantidad de niveles debe coincidir con (maxLevel - minLevel + 1) y ' +
      'deben cubrir todos los valores desde minLevel hasta maxLevel sin saltos.',
    type: [CreateNestedMaturityLevelDto],
    example: [
      {
        level: 0,
        name: 'Inexistente',
        shortName: 'N/A',
        description: 'No existe proceso documentado',
        color: '#EF4444',
        order: 0,
      },
      {
        level: 1,
        name: 'Inicial',
        shortName: 'Init',
        description: 'Procesos ad-hoc y desorganizados',
        color: '#F59E0B',
        icon: '🟠',
        order: 1,
        isMinimumAcceptable: true,
      },
      {
        level: 2,
        name: 'Repetible',
        shortName: 'Rep',
        description: 'Procesos repetibles con resultados consistentes',
        color: '#FBBF24',
        icon: '🟡',
        order: 2,
      },
      {
        level: 3,
        name: 'Definido',
        shortName: 'Def',
        description: 'Procesos documentados y estandarizados',
        color: '#3B82F6',
        icon: '🔵',
        order: 3,
      },
      {
        level: 4,
        name: 'Administrado',
        shortName: 'Adm',
        description: 'Procesos medidos y controlados',
        color: '#8B5CF6',
        icon: '🟣',
        order: 4,
      },
      {
        level: 5,
        name: 'Optimizado',
        shortName: 'Opt',
        description: 'Mejora continua basada en métricas',
        color: '#10B981',
        icon: '🟢',
        order: 5,
        isTarget: true,
      },
    ],
  })
  @IsArray({ message: 'Los niveles de madurez son obligatorios' })
  @ArrayMinSize(1, {
    message: 'Debe proporcionar al menos un nivel de madurez',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateNestedMaturityLevelDto)
  levels: CreateNestedMaturityLevelDto[]
}

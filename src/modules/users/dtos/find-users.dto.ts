import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator'
import { PaginationDto } from '@core/dtos'
import { Role } from '@core'
import { UserEntity } from '../entities/user.entity'
import { IsBoolean, IsIn } from '@core/i18n'
import { Transform } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * Campos por los que se puede ordenar la lista de usuarios
 */
export const USER_SORTABLE_FIELDS: (keyof UserEntity)[] = [
  'lastNames',
  'email',
  'createdAt',
  'isActive',
  'ci',
  'phone',
  'names',
  'updatedAt',
]

/**
 * Campos en los que busca el parámetro 'search'
 */
export const USER_SEARCH_FIELDS: (keyof UserEntity)[] = [
  'names',
  'lastNames',
  'email',
  'username',
  'ci',
]

export class FindUsersDto extends PaginationDto {
  /**
   * Búsqueda de texto libre
   * Busca en: names, lastNames, email, username, ci
   */
  @IsOptional()
  @IsString()
  search?: string

  /**
   * Filtrar por estado de la organización
   */
  @ApiPropertyOptional({
    description: 'Filtrar por estado activo/inactivo',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return Boolean(value)
  })
  @IsBoolean()
  isActive?: boolean

  /**

  /**
   * Filtrar por rol
   */
  @IsOptional()
  @IsEnum(Role)
  role?: Role

  /**
   * Filtrar por organización
   */
  @ApiPropertyOptional({
    description: 'Filtrar usuarios por ID de organización (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El organizationId debe ser un UUID válido' })
  organizationId?: string

  @ApiProperty({
    description: 'Campo por el cual ordenar (Solo uno)',
    required: false,
    enum: USER_SORTABLE_FIELDS, // Esto crea el dropdown en Swagger
    example: 'createdAt', // Esto sugiere un valor limpio
  })
  @Transform(({ value }) => {
    if (!value) return value

    // PASO 1: Si Swagger envía algo como '"createdAt", "name"', lo convertimos a string
    let cleanValue = String(value)

    // PASO 2: Si viene con comas (varios valores), nos quedamos SOLO CON EL PRIMERO
    if (cleanValue.includes(',')) {
      cleanValue = cleanValue.split(',')[0]
    }

    // PASO 3: Quitamos comillas dobles, simples, corchetes o espacios que Swagger agregue
    // Elimina " ' [ ] y espacios
    return cleanValue.replace(/['"\[\]]+/g, '').trim()
  })
  @IsOptional()
  @IsIn(USER_SORTABLE_FIELDS)
  sortBy?: string = 'createdAt'
}

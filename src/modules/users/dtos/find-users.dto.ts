import { IsOptional, IsString, IsEnum } from 'class-validator'
import { PaginationDto } from '@core/dtos'
import { Role, UserEntity } from '../entities/user.entity'
import { IsBoolean, IsIn } from '@core/i18n'
import { Transform } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'

/**
 * Campos por los que se puede ordenar la lista de usuarios
 */
export const USER_SORTABLE_FIELDS: (keyof UserEntity)[] = [
  'lastNames',
  'email',
  'createdAt',
  'organizationId',
  'isActive',
  'ci',
  'phone',
  'names',
]

/**
 * Campos en los que busca el parámetro 'search'
 */
export const USER_SEARCH_FIELDS = [
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
  @IsOptional()
  @IsString()
  organizationId?: string

  @IsOptional()
  @IsIn(USER_SORTABLE_FIELDS)
  sortBy?: string = 'createdAt'
}

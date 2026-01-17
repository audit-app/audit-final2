import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator'
import { PaginationDto } from '@core/dtos'
import { Transform } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'

/**
 * Campos por los que se puede ordenar la lista de organizaciones
 */
export const ORGANIZATION_SORTABLE_FIELDS = [
  'name',
  'nit',
  'createdAt',
  'isActive',
  'email',
]

/**
 * Campos en los que busca el parámetro 'search'
 */
export const ORGANIZATION_SEARCH_FIELDS = [
  'name',
  'nit',
  'description',
  'email',
]

/**
 * DTO para buscar organizaciones con filtros específicos
 *
 * Extiende PaginationDto para heredar:
 * - page
 * - limit
 * - all
 * - sortBy
 * - sortOrder
 *
 * Y agrega filtros específicos de organizaciones
 *
 * @example
 * ```
 * GET /organizations?page=1&limit=10&search=empresa&isActive=true
 * GET /organizations?all=true  // Todas las organizaciones
 * GET /organizations?page=2&limit=20&sortBy=createdAt&sortOrder=ASC
 * GET /organizations?search=coca&hasLogo=true  // Con logo
 * ```
 */
export class FindOrganizationsDto extends PaginationDto {
  /**
   * Búsqueda de texto libre
   * Busca en: name, nit, description, email
   */
  @ApiPropertyOptional({
    description: 'Búsqueda de texto libre en nombre, NIT, descripción o email',
    example: 'coca cola',
  })
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
   * Filtrar organizaciones que tienen logo
   */
  @ApiPropertyOptional({
    description: 'Filtrar organizaciones que tienen logo',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return Boolean(value)
  })
  @IsBoolean()
  hasLogo?: boolean

  @IsOptional()
  @IsIn(ORGANIZATION_SORTABLE_FIELDS)
  sortBy?: string = 'createdAt'
}

import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsEnum,
  IsString,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
/**
 * DTO Base para Paginación
 *
 * @example
 * ```typescript
 * // Uso directo
 * @Get()
 * findAll(@Query() query: PaginationDto) {
 *   return this.service.findAll(query)
 * }
 *
 * // Extendido con filtros
 * export class FindUsersDto extends PaginationDto {
 *   @IsOptional()
 *   @IsString()
 *   search?: string
 *
 *   @IsOptional()
 *   @IsEnum(Role)
 *   role?: Role
 * }
 * ```
 */
export class PaginationDto {
  /**
   * Número de página (empieza en 1)
   * @default 1
   */
  @ApiPropertyOptional({
    description: 'Número de página (empieza en 1)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  /**
   * Cantidad de registros por página
   * @default 10
   * @max 500
   */
  @ApiPropertyOptional({
    description: 'Cantidad de registros por página',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 10

  /**
   * Si es true, devuelve TODOS los registros (ignora page y limit)
   * Pero mantiene la misma estructura de respuesta
   * @default false
   */
  @ApiPropertyOptional({
    description:
      'Si es true, devuelve TODOS los registros (ignora page y limit)',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    return value === 'true' || value === true || value === 1 || value === '1'
  })
  @IsBoolean()
  all?: boolean = false

  /**
   * Campo por el cual ordenar
   * @example 'createdAt'
   */
  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar los resultados',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value
    // Sanitizar: remover comillas, espacios extras, y tomar solo el primer valor si hay comas
    return value
      .trim()
      .replace(/['"]/g, '') // Remover comillas simples y dobles
      .split(',')[0] // Si hay comas, tomar solo el primer valor
      .trim()
  })
  sortBy?: string

  /**
   * Dirección del ordenamiento
   * @default 'DESC'
   */
  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento (ascendente o descendente)',
    enum: SortOrder,
    example: SortOrder.DESC,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : undefined,
  )
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC
}

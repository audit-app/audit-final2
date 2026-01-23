import { IsOptional, IsBoolean, IsIn } from 'class-validator'
import { Transform } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { PaginationDto } from '@core/dtos'
import { MaturityFrameworkEntity } from '../entities'
import { IsString } from '@core/i18n'

// Definimos las columnas por las que SÍ permitimos ordenar
// (Esto protege tu base de datos de errores si intentan ordenar por un campo que no existe)
const VALID_SORT_COLUMNS: (keyof MaturityFrameworkEntity)[] = [
  'name',
  'code',
  'createdAt',
  'isActive',
  'minLevel',
  'maxLevel',
]
export const FRAMEWORK_SEARCH_FIELDS: (keyof MaturityFrameworkEntity)[] = [
  'name',
  'description',
  'code',
]

export class FindMaturityFrameworksDto extends PaginationDto {
  // 1. FILTRO DE ACTIVO (Tu código, está perfecto)
  @ApiPropertyOptional({
    description: 'Filtrar solo frameworks activos',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isActive?: boolean

  // 2. ORDENAMIENTO (La corrección para el error de Swagger y seguridad)
  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    enum: VALID_SORT_COLUMNS, // Crea el dropdown en Swagger
    example: 'createdAt',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value
    // Limpieza agresiva para arreglar el bug de Swagger de las comillas dobles y arrays
    let cleanValue = String(value)
    if (cleanValue.includes(',')) {
      cleanValue = cleanValue.split(',')[0] // Tomamos solo el primero
    }
    return cleanValue.replace(/['"\[\]]+/g, '').trim() // Quitamos basura
  })
  @IsIn(VALID_SORT_COLUMNS, {
    message: `El campo sortBy debe ser uno de: ${VALID_SORT_COLUMNS.join(', ')}`,
  })
  sortBy?: string = 'createdAt'

  @IsOptional()
  search?: string
}

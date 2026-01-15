import { IsOptional, IsString, IsEnum } from 'class-validator'
import { PaginationDto } from '@core/dtos'
import { TemplateStatus } from '../constants/template-status.enum'
import { TemplateEntity } from '../entities/template.entity'
import { IsIn } from '@core/i18n'

/**
 * Campos por los que se puede ordenar la lista de plantillas
 */
export const TEMPLATE_SORTABLE_FIELDS: (keyof TemplateEntity)[] = [
  'name',
  'version',
  'status',
  'createdAt',
  'updatedAt',
]

/**
 * Campos en los que busca el parámetro 'search'
 */
export const TEMPLATE_SEARCH_FIELDS = ['name', 'description', 'version']

export class FindTemplatesDto extends PaginationDto {
  /**
   * Búsqueda de texto libre
   * Busca en: name, description, version
   */
  @IsOptional()
  @IsString()
  search?: string

  /**
   * Filtrar por estado de la plantilla
   * Puede ser: draft, published, archived
   * Si no se especifica, devuelve plantillas con cualquier estado
   */
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus

  @IsOptional()
  @IsIn(TEMPLATE_SORTABLE_FIELDS)
  sortBy?: string = 'createdAt'
}

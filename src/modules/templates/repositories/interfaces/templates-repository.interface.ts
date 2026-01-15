import type { IBaseRepository } from '@core/repositories'
import type { TemplateEntity } from '../../entities/template.entity'
import type { TemplateStatus } from '../../constants/template-status.enum'

/**
 * Filtros para búsqueda de templates
 */
export interface TemplateFilters {
  search?: string
  status?: TemplateStatus
}

/**
 * Templates Repository Interface
 *
 * Define los métodos personalizados para el repositorio de templates
 */
export interface ITemplatesRepository extends IBaseRepository<TemplateEntity> {
  /**
   * Busca un template por nombre y versión
   */
  findByNameAndVersion(
    name: string,
    version: string,
  ): Promise<TemplateEntity | null>

  /**
   * Obtiene todos los templates con un status específico
   */
  findByStatus(status: TemplateStatus): Promise<TemplateEntity[]>

  /**
   * Obtiene todos los templates publicados (usables)
   */
  findPublished(): Promise<TemplateEntity[]>

  /**
   * Obtiene un template con sus standards
   */
  findOneWithStandards(id: string): Promise<TemplateEntity | null>

  /**
   * Cambia el status de un template
   */
  updateStatus(
    id: string,
    status: TemplateStatus,
  ): Promise<TemplateEntity | null>

  /**
   * Obtiene todas las versiones de un template
   */
  findVersionsByName(name: string): Promise<TemplateEntity[]>

  /**
   * Obtiene la última versión de un template
   */
  findLatestVersion(name: string): Promise<TemplateEntity | null>

  /**
   * Busca templates con filtros y paginación
   *
   * @param filters - Filtros de búsqueda
   * @param page - Número de página (opcional)
   * @param limit - Cantidad de resultados por página (opcional)
   * @param sortBy - Campo por el cual ordenar (opcional)
   * @param sortOrder - Orden ASC o DESC (opcional)
   * @returns Tupla [templates, total]
   */
  findWithFilters(
    filters: TemplateFilters,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
  ): Promise<[TemplateEntity[], number]>
}

import type { IBaseRepository } from '@core/repositories'
import type { StandardEntity } from '../../entities/standard.entity'

/**
 * Standards Repository Interface
 *
 * Define los métodos personalizados para el repositorio de standards
 */
export interface IStandardsRepository extends IBaseRepository<StandardEntity> {
  getTree(templateId: string, search?: string): Promise<StandardEntity[]>
  findByTemplate(templateId: string): Promise<StandardEntity[]>
  findByParent(
    templateId: string,
    parentId: string | null,
  ): Promise<StandardEntity[]>
  findAuditableByTemplate(templateId: string): Promise<StandardEntity[]>
  findByCode(templateId: string, code: string): Promise<StandardEntity | null>
  existsByCodeInTemplate(
    templateId: string,
    code: string,
    excludeId?: string,
  ): Promise<boolean>
  countChildren(parentId: string): Promise<number>
  getMaxOrderByParent(
    templateId: string,
    parentId: string | null,
  ): Promise<number>
}

import { IBaseRepository } from '@core/repositories'
import { OrganizationEntity } from '../entities'

export interface OrganizationFilters {
  search?: string
  isActive?: boolean
  hasLogo?: boolean
}

export interface IOrganizationRepository extends IBaseRepository<OrganizationEntity> {
  findByNit(nit: string): Promise<OrganizationEntity | null>
  findByName(name: string): Promise<OrganizationEntity | null>
  findWithFilters(
    filters: OrganizationFilters,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
  ): Promise<[OrganizationEntity[], number]>
}

import { IBaseRepository } from '@core/repositories'
import { OrganizationEntity } from '../entities'
import { PaginatedData } from '@core/dtos'

export interface OrganizationFilters {
  search?: string
  isActive?: boolean
  hasLogo?: boolean
}

export interface IOrganizationRepository extends IBaseRepository<OrganizationEntity> {
  findByNit(nit: string): Promise<OrganizationEntity | null>
  findByName(name: string): Promise<OrganizationEntity | null>
  paginateOrganizations(
    filters: OrganizationFilters,
  ): Promise<PaginatedData<OrganizationEntity>>
}

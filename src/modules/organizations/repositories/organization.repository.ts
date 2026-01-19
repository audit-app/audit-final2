import { BaseRepository } from '@core/repositories'
import { OrganizationEntity } from '../entities'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsWhere, ILike, IsNull, Not, Repository } from 'typeorm'
import { TransactionService, AuditService } from '@core/database'
import { IOrganizationRepository } from './organization-repository.interface'
import { Injectable } from '@nestjs/common'
import {
  FindOrganizationsDto,
  ORGANIZATION_SEARCH_FIELDS,
} from '../use-cases/find-organizations-with-filters'
import { PaginatedData } from '@core/dtos'

@Injectable()
export class OrganizationRepository
  extends BaseRepository<OrganizationEntity>
  implements IOrganizationRepository
{
  constructor(
    @InjectRepository(OrganizationEntity)
    repository: Repository<OrganizationEntity>,
    transactionService: TransactionService,
    auditService: AuditService,
  ) {
    super(repository, transactionService, auditService)
  }

  async findByNit(nit: string): Promise<OrganizationEntity | null> {
    return await this.getRepo().findOne({
      where: { nit },
    })
  }

  async findByName(name: string): Promise<OrganizationEntity | null> {
    return await this.getRepo().findOne({
      where: { name },
    })
  }

  async paginateOrganizations(
    query: FindOrganizationsDto,
  ): Promise<PaginatedData<OrganizationEntity>> {
    const { search, isActive, hasLogo } = query

    // 1. Filtros Base (AND)
    const baseFilter: FindOptionsWhere<OrganizationEntity> = {}

    if (isActive !== undefined) {
      baseFilter.isActive = isActive
    }

    // Lógica para hasLogo usando operadores de TypeORM
    if (hasLogo !== undefined) {
      baseFilter.logoUrl = hasLogo ? Not(IsNull()) : IsNull()
    }

    // 2. Lógica de Búsqueda (OR) + Filtros Base
    let where:
      | FindOptionsWhere<OrganizationEntity>
      | FindOptionsWhere<OrganizationEntity>[] = baseFilter

    if (search) {
      const searchTerm = ILike(`%${search}%`)

      where = ORGANIZATION_SEARCH_FIELDS.map((field) => ({
        ...baseFilter,
        [field]: searchTerm,
      }))
    }

    // 3. Delegar al BaseRepository
    return await this.paginate(query, {
      where,
    })
  }
}

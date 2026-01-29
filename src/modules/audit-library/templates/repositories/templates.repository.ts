import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Repository } from 'typeorm'
import { BaseRepository } from '@core/repositories'
import { TransactionService } from '@core/database'
import { AuditService } from '@core/context'
import { TemplateEntity } from '../entities/template.entity'
import { PaginatedData } from '@core/dtos'
import { FindTemplatesDto, TEMPLATE_SEARCH_FIELDS } from '../dtos'
import { ITemplatesRepository } from './templates-repository.interface'

/**
 * Templates Repository
 *
 * Repositorio para gestionar templates de auditoría
 * Usa BaseRepository para integración con CLS y transacciones
 */
@Injectable()
export class TemplatesRepository
  extends BaseRepository<TemplateEntity>
  implements ITemplatesRepository
{
  constructor(
    @InjectRepository(TemplateEntity)
    repository: Repository<TemplateEntity>,
    transactionService: TransactionService,
    auditService: AuditService,
  ) {
    super(repository, transactionService, auditService)
  }

  async existsByCodeAndVersion(
    code: string,
    version: string,
    excludeId?: string,
  ): Promise<boolean> {
    const query = this.getRepo()
      .createQueryBuilder('template')
      .where('template.code = :code', { code })
      .andWhere('template.version = :version', { version })

    if (excludeId) {
      query.andWhere('template.id != :excludeId', { excludeId })
    }

    const count = await query.getCount()
    return count > 0
  }

  async paginateTemplates(
    query: FindTemplatesDto,
  ): Promise<PaginatedData<TemplateEntity>> {
    const { search, status } = query

    const qb = this.getRepo().createQueryBuilder('template')

    if (status) {
      qb.andWhere('template.status = :status', { status })
    }

    if (search) {
      qb.andWhere(
        new Brackets((innerQb) => {
          TEMPLATE_SEARCH_FIELDS.forEach((field) => {
            innerQb.orWhere(`LOWER(template.${field}) LIKE LOWER(:search)`, {
              search: `%${search}%`,
            })
          })
        }),
      )
    }

    return await this.paginateQueryBuilder(qb, query)
  }
}

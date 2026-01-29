import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Repository } from 'typeorm'
import { BaseRepository } from '@core/repositories'
import { TransactionService } from '@core/database'
import { AuditService } from '@core/context'
import { MaturityFrameworkEntity } from '../entities/maturity-framework.entity'
import type { IFrameworksRepository } from './interfaces/frameworks-repository.interface'
import { FindMaturityFrameworksDto, FRAMEWORK_SEARCH_FIELDS } from '../dtos'
import { PaginatedData } from '@core/dtos'

/**
 * Maturity Frameworks Repository
 *
 * Repositorio para gestionar frameworks de madurez
 * Usa BaseRepository para integración con CLS y transacciones
 */
@Injectable()
export class MaturityFrameworksRepository
  extends BaseRepository<MaturityFrameworkEntity>
  implements IFrameworksRepository
{
  constructor(
    @InjectRepository(MaturityFrameworkEntity)
    repository: Repository<MaturityFrameworkEntity>,
    transactionService: TransactionService,
    auditService: AuditService,
  ) {
    super(repository, transactionService, auditService)
  }

  /**
   * Busca un framework por su código único
   *
   * @param code - Código del framework (ej: 'cobit5', 'cmmi')
   * @returns Framework encontrado o null
   */
  async findByCode(code: string): Promise<MaturityFrameworkEntity | null> {
    return await this.getRepo().findOne({
      where: { code },
    })
  }

  /**
   * Obtiene un framework con sus niveles
   *
   * @param id - ID del framework
   * @returns Framework con niveles ordenados o null
   */
  async findOneWithLevels(id: string): Promise<MaturityFrameworkEntity | null> {
    return await this.getRepo().findOne({
      where: { id },
      relations: {
        levels: true,
      },
      order: {
        levels: {
          order: 'ASC',
        },
      },
    })
  }

  async paginateFrameworks(
    query: FindMaturityFrameworksDto,
  ): Promise<PaginatedData<MaturityFrameworkEntity>> {
    const { search, isActive } = query

    // 1. Usamos getRepo() (del padre) para soportar Transacciones automáticamente
    const qb = this.getRepo().createQueryBuilder('framework')

    // 2. Filtro Exacto: isActive
    // Verificamos undefined para que funcione con false
    if (isActive !== undefined) {
      qb.andWhere('framework.isActive = :isActive', { isActive })
    }

    // 3. Búsqueda Difusa (Search) usando Brackets
    if (search) {
      qb.andWhere(
        new Brackets((innerQb) => {
          FRAMEWORK_SEARCH_FIELDS.forEach((field) => {
            // LOWER para búsqueda case-insensitive
            innerQb.orWhere(`LOWER(framework.${field}) LIKE LOWER(:search)`, {
              search: `%${search}%`,
            })
          })
        }),
      )
    }

    return await this.paginateQueryBuilder(qb, query)
  }
}

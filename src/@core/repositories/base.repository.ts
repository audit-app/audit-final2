import { BaseEntity } from '@core/entities'
import {
  type DeepPartial,
  type FindManyOptions,
  type FindOneOptions,
  type FindOptionsWhere,
  type Repository,
  FindOptionsOrder,
  In,
} from 'typeorm'
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { IBaseRepository } from './base-repository.interface'
import { TransactionService, AuditService } from '@core/database'
import { PaginationDto, PaginatedData } from '@core/dtos'

export abstract class BaseRepository<
  T extends BaseEntity,
> implements IBaseRepository<T> {
  protected constructor(
    protected readonly repository: Repository<T>,
    protected readonly transactionService: TransactionService,
    protected readonly auditService: AuditService,
  ) {}

  /**
   * Obtiene el repositorio correcto según el contexto:
   * 1. Si hay una transacción activa, usa su EntityManager
   * 2. Si no, usa el repositorio por defecto
   *
   * IMPORTANTE: Usa TransactionService para mantener consistencia
   * en el manejo de transacciones en toda la aplicación
   */
  protected getRepo(): Repository<T> {
    const contextEntityManager =
      this.transactionService.getCurrentEntityManager()

    // Si hay un EntityManager activo, usarlo
    if (
      contextEntityManager &&
      typeof contextEntityManager.getRepository === 'function'
    ) {
      return contextEntityManager.getRepository(this.repository.target)
    }

    // No hay transacción activa, usar el repository por defecto
    return this.repository
  }

  // ---------- Métodos de creación ----------
  protected create(data: DeepPartial<T>): T {
    return this.getRepo().create(data)
  }

  protected createMany(data: DeepPartial<T>[]): T[] {
    return this.getRepo().create(data)
  }

  // ---------- Métodos de guardado ----------
  async save(data: DeepPartial<T>): Promise<T> {
    const createdEntity = this.create(data)

    // Aplicar auditoría automática (createdBy para nuevas entidades)
    // Solo aplica si la entidad no tiene ID (es nueva)
    const isNew = !createdEntity.id
    this.auditService.applyAudit(createdEntity, isNew)

    return await this.getRepo().save(createdEntity)
  }

  async saveMany(data: DeepPartial<T>[]): Promise<T[]> {
    const entities = this.createMany(data)

    entities.forEach((entity) => {
      const isNew = !entity.id
      this.auditService.applyAudit(entity, isNew)
    })

    return await this.getRepo().save(entities)
  }

  // ---------- Métodos de búsqueda ----------
  async findById(id: string): Promise<T | null> {
    return await this.getRepo().findOne({
      where: { id } as FindOptionsWhere<T>,
    })
  }

  async findByIds(ids: Array<string>): Promise<T[]> {
    return await this.getRepo().find({
      where: {
        id: In(ids),
      },
    } as FindManyOptions<T>)
  }

  protected async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.getRepo().find(options)
  }

  // Búsqueda genérica
  protected async findOne(
    where: FindOptionsWhere<T>,
    options?: FindOneOptions<T>,
  ): Promise<T | null> {
    return await this.getRepo().findOne({
      where,
      ...options,
    })
  }

  protected async findWhere(
    where: FindOptionsWhere<T>,
    options?: FindManyOptions<T>,
  ): Promise<T[]> {
    return await this.getRepo().find({
      where,
      ...options,
    })
  }

  protected async count(where?: FindOptionsWhere<T>): Promise<number> {
    return await this.getRepo().count({ where })
  }

  protected async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.count(where)
    return count > 0
  }

  protected async paginate(
    query: PaginationDto,
    options?: FindManyOptions<T>,
  ): Promise<PaginatedData<T>> {
    const { page = 1, limit = 10, all = false, sortBy, sortOrder } = query

    let order: FindOptionsOrder<T> =
      (options?.order as FindOptionsOrder<T>) || {}

    if (sortBy) {
      order = {
        ...order,
        [sortBy as keyof T]: sortOrder || 'DESC',
      }
    }

    const findOptions: FindManyOptions<T> = {
      ...options,
      order,
    }

    if (all) {
      const allRecords = await this.findAll(findOptions)
      return { data: allRecords, total: allRecords.length }
    }

    const skip = (page - 1) * limit
    const [data, total] = await this.getRepo().findAndCount({
      ...findOptions,
      take: limit,
      skip,
    })

    return { data, total }
  }

  // ---------- Métodos de actualización ----------

  async update(
    criteria: string | number | FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<boolean> {
    const auditData = this.auditService.getUpdateAudit()
    const dataWithAudit = { ...partialEntity, ...auditData }

    // Ejecución
    const result = await this.getRepo().update(criteria, dataWithAudit)

    // Tu mapeo estándar a booleano
    return (result.affected ?? 0) > 0
  }

  async patch(entity: T, partialEntity: DeepPartial<T>): Promise<T> {
    const updatedEntity = this.getRepo().merge(entity, partialEntity)

    // Aplicar auditoría (updatedBy) - no es nueva entidad
    this.auditService.applyAudit(updatedEntity, false)

    return this.getRepo().save(updatedEntity)
  }

  // ---------- Métodos de eliminación ----------

  async softDelete(id: string): Promise<boolean> {
    const result = await this.getRepo().softDelete(id)
    return (result.affected ?? 0) > 0
  }

  async recover(id: string): Promise<boolean> {
    const result = await this.getRepo().restore(id)
    return (result.affected ?? 0) > 0
  }
}

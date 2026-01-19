// ibase-repository.interface.ts
import { DeepPartial, FindOptionsWhere } from 'typeorm'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { BaseEntity } from '@core/entities'

export interface IBaseRepository<T extends BaseEntity> {
  save(data: DeepPartial<T>): Promise<T>
  saveMany(data: DeepPartial<T>[]): Promise<T[]>
  findById(id: string): Promise<T | null>
  findByIds(ids: Array<string>): Promise<T[]>
  update(
    criteria: string | number | FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<boolean>
  patch(entity: T, partialEntity: DeepPartial<T>): Promise<T>
  softDelete(id: string): Promise<boolean>
  recover(id: string): Promise<boolean>
}

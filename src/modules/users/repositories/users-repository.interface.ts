import { IBaseRepository } from '@core/repositories/base-repository.interface'
import { UserEntity } from '../entities/user.entity'
import { PaginatedData } from '@core/dtos'
import { FindUsersDto } from '../dtos'

export interface IUsersRepository extends IBaseRepository<UserEntity> {
  // Búsquedas básicas
  findByEmail(email: string): Promise<UserEntity | null>
  findByUsername(username: string): Promise<UserEntity | null>
  findByUsernameOrEmailWithPassword(
    usernameOrEmail: string,
  ): Promise<UserEntity | null>
  findByCI(ci: string): Promise<UserEntity | null>
  // Perfil de usuario
  getProfile(userId: string): Promise<UserEntity | null>
  // Validaciones de unicidad
  existsByEmail(email: string, excludeId?: string): Promise<boolean>
  existsByUsername(username: string, excludeId?: string): Promise<boolean>
  existsByCI(ci: string, excludeId?: string): Promise<boolean>
  // Validaciones de organización
  findByOrganization(organizationId: string): Promise<UserEntity[]>
  countUsersByOrganization(organizationId: string): Promise<number>
  // Búsquedas avanzadas
  paginateUsers(query: FindUsersDto): Promise<PaginatedData<UserEntity>>
  //metodos adicionales si es necesario
  deactivateUsersByOrganization(organizationId: string): Promise<boolean>
}

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, FindOptionsWhere, ILike } from 'typeorm'
import { TransactionService } from '@core/database'
import { AuditService } from '@core/context'
import { BaseRepository } from '@core/repositories/base.repository'
import { UserEntity } from '../entities/user.entity'
import { IUsersRepository } from './users-repository.interface'
import { PaginatedData } from '@core/dtos'
import { FindUsersDto, USER_SEARCH_FIELDS } from '../dtos'
import { ArrayContains } from 'typeorm'
@Injectable()
export class UsersRepository
  extends BaseRepository<UserEntity>
  implements IUsersRepository
{
  constructor(
    @InjectRepository(UserEntity)
    repository: Repository<UserEntity>,
    transactionService: TransactionService,
    auditService: AuditService,
  ) {
    super(repository, transactionService, auditService)
  }

  /**
   * Busca un usuario por su email incluyendo si está eliminado
   * @param email
   * @returns Usuario o null si no existe
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.getRepo().findOne({
      where: { email: email.toLowerCase() },
      relations: { organization: true },
    })
  }

  /**
   * Busca un usuario por su email incluyendo si está eliminado
   * @param email
   * @returns Usuario o null si no existe
   */
  async findByUsername(username: string): Promise<UserEntity | null> {
    return await this.getRepo().findOne({
      where: { username: username.toLowerCase() },
      relations: { organization: true },
    })
  }

  /**
   * Busca un usuario por su CI incluyendo si está eliminado
   * @param ci
   * @returns Usuario o null si no existe
   */
  async findByCI(ci: string): Promise<UserEntity | null> {
    return await this.getRepo().findOne({
      where: { ci },
      relations: { organization: true },
    })
  }

  /**
   * Valida si existe un usuario con el email dado
   * @param email - Email a validar
   * @param excludeId - ID del usuario a excluir de la validación (para updates)
   * @returns true si existe, false si no existe
   */
  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const query = this.getRepo()
      .createQueryBuilder('user')
      .where('user.email = :email', {
        email: email.toLowerCase(),
      })
    if (excludeId) {
      query.andWhere('user.id != :id', { id: excludeId })
    }

    const count = await query.getCount()
    return count > 0
  }

  /**
   * Valida si existe un usuario con el username dado
   * @param username - Username a validar
   * @param excludeId - ID del usuario a excluir de la validación (para updates)
   * @returns true si existe, false si no existe
   */
  async existsByUsername(
    username: string,
    excludeId?: string,
  ): Promise<boolean> {
    const query = this.getRepo()
      .createQueryBuilder('user')
      .where('user.username = :username', {
        username: username.toLowerCase(),
      })

    if (excludeId) {
      query.andWhere('user.id != :id', { id: excludeId })
    }

    const count = await query.getCount()
    return count > 0
  }

  /**
   * Valida si existe un usuario con el CI dado
   * @param ci - CI a validar
   * @param excludeId - ID del usuario a excluir de la validación (para updates)
   * @returns true si existe, false si no existe
   */
  async existsByCI(ci: string, excludeId?: string): Promise<boolean> {
    const query = this.getRepo()
      .createQueryBuilder('user')
      .where('user.ci = :ci', { ci })

    if (excludeId) {
      query.andWhere('user.id != :id', { id: excludeId })
    }

    const count = await query.getCount()
    return count > 0
  }

  /**
   * Busca un usuario por email o username e incluye el password
   * Usado para autenticación
   *
   * @param usernameOrEmail - Email o username (case-insensitive)
   * @returns Usuario con password, o null si no existe
   */
  async findByUsernameOrEmailWithPassword(
    usernameOrEmail: string,
  ): Promise<UserEntity | null> {
    const normalized = usernameOrEmail.toLowerCase()

    return await this.getRepo()
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('LOWER(user.email) = :identifier', { identifier: normalized })
      .orWhere('LOWER(user.username) = :identifier', { identifier: normalized })
      .getOne()
  }

  /**
   * Busca todos los usuarios de una organización
   * @param organizationId - ID de la organización
   * @returns Lista de usuarios
   */
  async findByOrganization(organizationId: string): Promise<UserEntity[]> {
    return await this.getRepo().find({
      where: { organizationId },
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Cuenta la cantidad de usuarios en una organización
   * @param organizationId - ID de la organización
   * @returns Cantidad de usuarios
   */
  async countUsersByOrganization(organizationId: string): Promise<number> {
    return await this.getRepo().count({
      where: { organizationId },
    })
  }

  /**
   * Paginación de usuarios con filtros avanzados
   *
   * RESPONSABILIDAD: Solo obtener y mapear datos de la BD
   * La construcción de la respuesta HTTP se hace en el use case
   *
   * Soporta búsqueda por:
   * - search: names, lastNames, email, username, ci (búsqueda de texto libre)
   * - isActive: estado del usuario (true/false) - opcional
   * - organizationId: filtrar por organización
   * - role: filtrar por rol
   *
   * @param query - DTO con filtros y opciones de paginación
   * @returns Datos crudos mapeados { data, total }
   */
  async paginateUsers(query: FindUsersDto): Promise<PaginatedData<UserEntity>> {
    const { search, isActive, organizationId, role } = query

    // 1. Construir Filtros WHERE
    const baseFilter: FindOptionsWhere<UserEntity> = {}
    if (isActive !== undefined) baseFilter.isActive = isActive
    if (organizationId) baseFilter.organizationId = organizationId
    if (role) baseFilter.roles = ArrayContains([role])

    let where: FindOptionsWhere<UserEntity> | FindOptionsWhere<UserEntity>[] =
      baseFilter

    if (search) {
      const searchTerm = ILike(`%${search}%`)
      where = USER_SEARCH_FIELDS.map((field) => ({
        ...baseFilter,
        [field]: searchTerm,
      }))
    }

    return await this.paginate(query, {
      where,
      relations: { organization: true },
    })
  }
  /**
   * Obtiene el perfil completo de un usuario por su ID
   * @param userId - ID del usuario
   * @returns Perfil del usuario como DTO o null si no existe
   */
  async getProfile(userId: string): Promise<UserEntity | null> {
    const user = await this.getRepo().findOne({
      where: { id: userId },
      relations: { organization: true },
    })

    if (!user) {
      return null
    }
    return user
  }

  async deactivateUsersByOrganization(
    organizationId: string,
  ): Promise<boolean> {
    return await this.update(
      { organizationId: organizationId, isActive: true },
      { isActive: false },
    )
  }
}

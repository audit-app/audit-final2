import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { UserEntity } from '../../entities/user.entity'
import { UserNotFoundException } from '../../exceptions'
import { USERS_REPOSITORY } from '../../tokens'
import type { IUsersRepository } from '../../repositories'

/**
 * Caso de uso: Eliminar un usuario (soft delete)
 *
 * Responsabilidades:
 * - Verificar que el usuario existe
 * - Realizar soft delete (marca deletedAt)
 * - Retornar el usuario eliminado
 */
@Injectable()
export class RemoveUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  @Transactional()
  async execute(id: string): Promise<UserEntity> {
    // 1. Verificar que el usuario existe
    const user = await this.usersRepository.findById(id)
    if (!user) {
      throw new UserNotFoundException(id)
    }

    // 2. Soft delete
    await this.usersRepository.softDelete(id)

    // 3. Retornar el usuario eliminado (para confirmación en frontend)
    return user
  }
}

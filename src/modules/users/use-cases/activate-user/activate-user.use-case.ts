import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { UserEntity } from '../../entities/user.entity'
import { UserNotFoundException } from '../../exceptions'
import { USERS_REPOSITORY } from '../../tokens'
import type { IUsersRepository } from '../../repositories'

/**
 * Caso de uso: Activar un usuario
 *
 * Responsabilidades:
 * - Verificar que el usuario existe
 * - Cambiar status a ACTIVE
 * - Persistir cambios
 */
@Injectable()
export class ActivateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  @Transactional()
  async execute(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findById(id)
    if (!user) {
      throw new UserNotFoundException(id)
    }
    user.isActive = true

    return await this.usersRepository.save(user)
  }
}

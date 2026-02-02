import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { UpdateUserDto } from './update-user.dto'
import { UserEntity } from '../../entities/user.entity'
import { UserValidator } from '../../validators'
import { UserFactory } from '../../factories/user.factory'
import { USERS_REPOSITORY } from '../../tokens'
import type { IUsersRepository } from '../../repositories'

/**
 * Caso de uso: Actualizar un usuario existente
 *
 * Responsabilidades:
 * - Verificar que el usuario existe
 * - Validar constraints únicas solo si cambiaron
 * - Validar organización solo si cambió
 * - Actualizar entidad con datos normalizados
 * - Persistir cambios en la base de datos
 */
@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly userValidator: UserValidator,
    private readonly userFactory: UserFactory,
  ) {}

  @Transactional()
  async execute(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.userValidator.validateAndGetUser(id)

    const validations: Promise<void>[] = []

    // NOTE: Email is NOT updated here (use POST /users/:id/change-email endpoint)

    if (dto.username && dto.username.toLowerCase() !== user.username) {
      validations.push(
        this.userValidator.validateUniqueUsername(dto.username, id),
      )
    }

    if (dto.ci && dto.ci !== user.ci) {
      validations.push(this.userValidator.validateUniqueCI(dto.ci, id))
    }

    if (dto.roles) {
      this.userValidator.validateRoles(dto.roles)
      this.userValidator.validateRoleTransition(user, dto.roles)
    }

    if (validations.length > 0) {
      await Promise.all(validations)
    }

    const updatedUser = this.userFactory.updateFromDto(user, dto)

    return await this.usersRepository.save(updatedUser)
  }
}

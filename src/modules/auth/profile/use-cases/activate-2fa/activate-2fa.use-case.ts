import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { UserEntity } from '../../../../users/entities/user.entity'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { UserValidator } from '../../../../users/validators/user.validator'

/**
 * Use Case: Usuario activa SU propio 2FA
 *
 * Diferencia con TwoFactorActivateUserUseCase (admin):
 * - Este use-case NO recibe userId como parámetro
 * - El userId se obtiene del token JWT autenticado (req.user.sub)
 * - NO requiere permisos de ADMIN
 * - Usuario solo puede activar SU propio 2FA
 *
 * Endpoint: PATCH /auth/profile/2fa/activate
 */
@Injectable()
export class ActivateTwoFactorUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly userValidator: UserValidator,
  ) {}

  @Transactional()
  async execute(userId: string): Promise<UserEntity> {
    // Validar que el usuario existe
    const user = await this.userValidator.validateAndGetUser(userId)

    // Activar 2FA
    user.twoFactorEnable()

    return await this.usersRepository.save(user)
  }
}

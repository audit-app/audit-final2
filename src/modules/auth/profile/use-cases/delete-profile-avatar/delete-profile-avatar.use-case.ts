import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { FilesService } from '@core/files'
import { UserEntity } from '../../../../users/entities/user.entity'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { UserValidator } from '../../../../users/validators/user.validator'

/**
 * Use Case: Usuario elimina SU propia imagen de perfil
 *
 * Diferencia con DeleteProfileImageUseCase (admin):
 * - Este use-case NO recibe userId como parámetro
 * - El userId se obtiene del token JWT autenticado (req.user.sub)
 * - NO requiere permisos de ADMIN
 * - Usuario solo puede eliminar SU propia imagen
 *
 * Endpoint: DELETE /auth/profile/avatar
 */
@Injectable()
export class DeleteProfileAvatarUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly userValidator: UserValidator,
    private readonly filesService: FilesService,
  ) {}

  @Transactional()
  async execute(userId: string): Promise<UserEntity> {
    // Validar que el usuario existe
    const user = await this.userValidator.validateAndGetUser(userId)

    // Eliminar imagen del storage si existe
    if (user.image) {
      await this.filesService.deleteFile(user.image)
    }

    // Actualizar usuario
    user.removeAvatar()
    return await this.usersRepository.save(user)
  }
}

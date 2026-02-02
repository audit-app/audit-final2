import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { FilesService, FileType } from '@core/files'
import { UserEntity } from '../../../../users/entities/user.entity'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { UserValidator } from '../../../../users/validators/user.validator'

/**
 * Use Case: Usuario sube SU propia imagen de perfil
 *
 * Diferencia con UploadProfileImageUseCase (admin):
 * - Este use-case NO recibe userId como parámetro
 * - El userId se obtiene del token JWT autenticado (req.user.sub)
 * - NO requiere permisos de ADMIN
 * - Usuario solo puede subir SU propia imagen
 *
 * Endpoint: POST /auth/profile/avatar
 */
@Injectable()
export class UploadProfileAvatarUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly userValidator: UserValidator,
    private readonly filesService: FilesService,
  ) {}

  @Transactional()
  async execute(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserEntity> {
    // Validar que el usuario existe
    const user = await this.userValidator.validateAndGetUser(userId)

    // Subir/reemplazar imagen
    const uploadResult = await this.filesService.replaceFile(user.image, {
      file,
      folder: 'users/profiles',
      customFileName: `user-${userId}`,
      overwrite: true,
      validationOptions: {
        fileType: FileType.IMAGE,
        maxSize: 2 * 1024 * 1024, // 2MB
        maxWidth: 800,
        maxHeight: 800,
      },
    })

    // Actualizar usuario
    user.updateAvatar(uploadResult.filePath)
    return await this.usersRepository.save(user)
  }
}

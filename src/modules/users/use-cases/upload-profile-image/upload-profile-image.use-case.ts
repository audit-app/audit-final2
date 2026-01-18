import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { FilesService, FileType } from '@core/files'
import { UserEntity } from '../../entities/user.entity'
import { USERS_REPOSITORY } from '../../tokens'
import type { IUsersRepository } from '../../repositories'
import { UserValidator } from '../../validators'

@Injectable()
export class UploadProfileImageUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly userValidator: UserValidator,
    private readonly filesService: FilesService,
  ) {}

  @Transactional()
  async execute(id: string, file: Express.Multer.File): Promise<UserEntity> {
    const user = await this.userValidator.validateAndGetUser(id)
    const uploadResult = await this.filesService.replaceFile(user.image, {
      file,
      folder: 'users/profiles',
      customFileName: `user-${id}`,
      overwrite: true,
      validationOptions: {
        fileType: FileType.IMAGE,
        maxSize: 2 * 1024 * 1024,
        maxWidth: 800,
        maxHeight: 800,
      },
    })

    user.updateAvatar(uploadResult.filePath)
    return await this.usersRepository.save(user)
  }
}

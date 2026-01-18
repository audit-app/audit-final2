import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { FilesService } from '@core/files'
import { UserEntity } from '../../entities/user.entity'
import { UserNotFoundException } from '../../exceptions'
import { USERS_REPOSITORY } from '../../tokens'
import type { IUsersRepository } from '../../repositories'
import { UserValidator } from '../../validators'

@Injectable()
export class DeleteProfileImageUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly userValidator: UserValidator,
    private readonly filesService: FilesService,
  ) {}

  @Transactional()
  async execute(id: string): Promise<UserEntity> {
    const user = await this.userValidator.validateAndGetUser(id)
    if (user.image) {
      await this.filesService.deleteFile(user.image)
    }
    user.removeAvatar()
    return await this.usersRepository.save(user)
  }
}

import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { UserEntity } from '../../entities/user.entity'
import { USERS_REPOSITORY } from '../../tokens'
import type { IUsersRepository } from '../../repositories'
import { UserValidator } from '../../validators'

@Injectable()
export class TwoFactorActivateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly userValidator: UserValidator,
  ) {}

  @Transactional()
  async execute(id: string): Promise<UserEntity> {
    const user = await this.userValidator.validateAndGetUser(id)
    user.twoFactorEnable()
    return await this.usersRepository.save(user)
  }
}

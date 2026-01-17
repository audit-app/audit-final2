import { Injectable, Inject } from '@nestjs/common'
import { USERS_REPOSITORY } from '../../tokens'
import type { IUsersRepository } from '../../repositories'
import { FindUsersDto } from '../../dtos/find-users.dto'
import { PaginatedResponse } from '@core/dtos'
import { UserResponseDto } from '../../dtos'

/**
 * Caso de uso: Obtener todos los usuarios
 */
@Injectable()
export class FindAllUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(
    findUsersDto: FindUsersDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    return await this.usersRepository.paginateUsers(findUsersDto)
  }
}

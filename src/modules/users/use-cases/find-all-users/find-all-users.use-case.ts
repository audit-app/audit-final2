import { Injectable, Inject } from '@nestjs/common'
import { USERS_REPOSITORY } from '../../tokens'
import type { IUsersRepository } from '../../repositories'
import { FindUsersDto } from './find-all-users.dto'
import { PaginatedResponse, PaginatedResponseBuilder } from '@core/dtos'
import { UserResponseDto } from '../../dtos'

/**
 * Caso de uso: Obtener todos los usuarios
 *
 * RESPONSABILIDAD: Coordinar la obtención de datos y construcción de la respuesta
 * - El repository obtiene los datos crudos { data, total }
 * - El use case construye la respuesta HTTP con metadata de paginación
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
    // 1. Obtener datos crudos del repositorio
    const result = await this.usersRepository.paginateUsers(findUsersDto)

    // 2. Si se pidió "all", usar createAll (metadata especial)
    if (findUsersDto.all) {
      return PaginatedResponseBuilder.createAll(result.data)
    }

    // 3. Construir respuesta paginada normal con metadata
    return PaginatedResponseBuilder.create(
      result.data,
      result.total,
      findUsersDto.page || 1,
      findUsersDto.limit || 10,
    )
  }
}

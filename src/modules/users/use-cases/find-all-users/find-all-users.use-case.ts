import { Injectable, Inject } from '@nestjs/common'
import { USERS_REPOSITORY } from '../../tokens'
import type { IUsersRepository } from '../../repositories'
import { FindUsersDto } from './find-all-users.dto'
import { PaginatedResponse, PaginatedResponseBuilder } from '@core/dtos'
import { UserResponseDto } from '../../dtos'
import { UserEntity } from '../../entities'

@Injectable()
export class FindAllUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(
    dto: FindUsersDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    // 1. Obtener Entidades del Repo
    const { data: entities, total } =
      await this.usersRepository.paginateUsers(dto)

    // 2. Mapear Entidad -> DTO (Aquí está la lógica de presentación)
    const dtos = entities.map((user) => this.mapToDto(user))

    // 3. Devolver respuesta paginada
    // Nota: Si usas tu builder, asegúrate que acepte los DTOs ya mapeados
    if (dto.all) {
      return PaginatedResponseBuilder.createAll(dtos)
    }

    return PaginatedResponseBuilder.create(
      dtos,
      total,
      dto.page || 1,
      dto.limit || 10,
    )
  }

  private mapToDto(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      names: user.names,
      lastNames: user.lastNames,
      email: user.email,
      username: user.username,
      ci: user.ci,
      phone: user.phone,
      address: user.address,
      image: user.image,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      roles: user.roles,
      organizationId: user.organizationId,
      organizationImage: user.organization?.logoUrl || null,
      organizationName: user.organization?.name || 'Sin organización',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}

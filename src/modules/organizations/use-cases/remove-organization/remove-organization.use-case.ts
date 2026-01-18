import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { OrganizationEntity } from '../../entities/organization.entity'
import {
  OrganizationNotFoundException,
  OrganizationHasActiveUsersException,
} from '../../exceptions'
import { ORGANIZATION_REPOSITORY } from '../../tokens'
import type { IOrganizationRepository } from '../../repositories'
import { USERS_REPOSITORY } from '../../../users/tokens'
import type { IUsersRepository } from '../../../users/repositories'

/**
 * Caso de uso: Eliminar una organización (soft delete)
 *
 * Responsabilidades:
 * - Verificar que la organización existe
 * - Verificar que no tiene usuarios activos
 * - Marcar como inactiva (soft delete)
 * - Retornar la organización desactivada
 */
@Injectable()
export class RemoveOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  @Transactional()
  async execute(id: string): Promise<OrganizationEntity> {
    // 1. Verificar que la organización existe y está activa
    const organization = await this.organizationRepository.findById(id)
    if (!organization) {
      throw new OrganizationNotFoundException(id)
    }

    // 2. Verificar que no tiene usuarios activos
    const activeUsersCount =
      await this.usersRepository.countUsersByOrganization(id)

    if (activeUsersCount > 0) {
      throw new OrganizationHasActiveUsersException()
    }

    // 3. Hacer softDelete
    await this.organizationRepository.softDelete(organization.id)

    // 4. Retornar la organización desactivada (para confirmación en frontend)
    return organization
  }
}

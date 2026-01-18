import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { OrganizationNotFoundException } from '../../exceptions'
import { ORGANIZATION_REPOSITORY } from '../../tokens'
import type { IOrganizationRepository } from '../../repositories'
import { USERS_REPOSITORY } from '../../../users/tokens'
import type { IUsersRepository } from '../../../users/repositories'

/**
 * Caso de uso: Desactivar organización y sus usuarios en cascada
 *
 * IMPORTANTE: Este caso de uso coordina la desactivación pero NO crea
 * dependencia circular porque:
 * - UsersModule exporta el token USERS_REPOSITORY
 * - OrganizationsModule lo inyecta directamente (no importa el módulo)
 * - Usa el REPOSITORY, NO el servicio
 *
 * Responsabilidades:
 * - Verificar que la organización existe
 * - Desactivar TODOS los usuarios de la organización
 * - Desactivar la organización
 */
@Injectable()
export class DeactivateOrganizationWithUsersUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  @Transactional()
  async execute(organizationId: string): Promise<void> {
    // 1. Verificar que la organización existe
    const organization =
      await this.organizationRepository.findById(organizationId)
    if (!organization) {
      throw new OrganizationNotFoundException(organizationId)
    }

    // 2. Obtener TODOS los usuarios de la organización (activos e inactivos)
    const users = await this.usersRepository.findByOrganization(organizationId)

    // 3. Suspender todos los usuarios activos
    for (const user of users) {
      if (user.isActive) {
        user.isActive = false
        await this.usersRepository.save(user)
      }
    }

    // 4. Desactivar la organización
    organization.isActive = false
    await this.organizationRepository.save(organization)
  }
}

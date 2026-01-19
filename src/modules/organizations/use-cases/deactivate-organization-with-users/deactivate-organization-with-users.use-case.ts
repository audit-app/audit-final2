import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { ORGANIZATION_REPOSITORY } from '../../tokens'
import type { IOrganizationRepository } from '../../repositories'
import { USERS_REPOSITORY } from '../../../users/tokens'
import type { IUsersRepository } from '../../../users/repositories'
import { OrganizationValidator } from '../../validators'

@Injectable()
export class DeactivateOrganizationWithUsersUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly organizationValidator: OrganizationValidator,
  ) {}

  @Transactional()
  async execute(organizationId: string): Promise<void> {
    // 1. Verificar que la organización existe
    const organization =
      await this.organizationValidator.validateAndGetOrganization(
        organizationId,
      )
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
    organization.deactivate()
    await this.organizationRepository.save(organization)
  }
}

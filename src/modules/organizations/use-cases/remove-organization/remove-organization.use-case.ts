import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { OrganizationHasActiveUsersException } from '../../exceptions'
import { ORGANIZATION_REPOSITORY } from '../../tokens'
import type { IOrganizationRepository } from '../../repositories'
import { USERS_REPOSITORY } from '../../../users/tokens'
import type { IUsersRepository } from '../../../users/repositories'
import { OrganizationValidator } from '../../validators'

@Injectable()
export class RemoveOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly organizationValidator: OrganizationValidator,
  ) {}

  @Transactional()
  async execute(id: string): Promise<void> {
    // 1. Verificar que la organización existe y está activa
    const organization =
      await this.organizationValidator.validateAndGetOrganization(id)

    // 2. Verificar que no tiene usuarios activos
    const activeUsersCount =
      await this.usersRepository.countUsersByOrganization(id)

    if (activeUsersCount > 0) {
      throw new OrganizationHasActiveUsersException()
    }

    // 3. Hacer softDelete
    await this.organizationRepository.softDelete(organization.id)
  }
}

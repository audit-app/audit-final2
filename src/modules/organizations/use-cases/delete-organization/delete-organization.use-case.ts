import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { ORGANIZATION_REPOSITORY } from '../../tokens'
import type { IOrganizationRepository } from '../../repositories'
import { OrganizationValidator } from '../../validators'
import { type IUsersRepository, USERS_REPOSITORY } from 'src/modules/users'
import { OrganizationHasActiveUsersException } from '../../exceptions'

/**
 * Caso de uso: Eliminar permanentemente una organización (hard delete)
 *
 * PRECAUCIÓN: Esta operación es irreversible
 *
 * Responsabilidades:
 * - Eliminar permanentemente la organización de la base de datos
 */
@Injectable()
export class DeleteOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    private readonly organizationValidator: OrganizationValidator,
    @Inject(USERS_REPOSITORY)
    private readonly userRepository: IUsersRepository,
  ) {}

  @Transactional()
  async execute(id: string): Promise<void> {
    const organization =
      await this.organizationValidator.ensureOrganizationExists(id)
    const count = await this.userRepository.countUsersByOrganization(id)
    if (count > 0) {
      throw new OrganizationHasActiveUsersException()
    }
    await this.organizationRepository.softDelete(id)
    return organization
  }
}

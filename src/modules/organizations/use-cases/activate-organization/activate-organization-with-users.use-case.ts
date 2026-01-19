import { Injectable, Inject } from '@nestjs/common'
import { ORGANIZATION_REPOSITORY } from '../../tokens'
import type { IOrganizationRepository } from '../../repositories'
import { OrganizationValidator } from '../../validators'

@Injectable()
export class ActivateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    private readonly organizationValidator: OrganizationValidator,
  ) {}

  async execute(organizationId: string): Promise<void> {
    const organization =
      await this.organizationValidator.validateAndGetOrganization(
        organizationId,
      )
    organization.activate()
    await this.organizationRepository.save(organization)
  }
}

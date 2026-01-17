import { Injectable, Inject } from '@nestjs/common'
import { OrganizationNotFoundException } from '../../exceptions'
import { ORGANIZATION_REPOSITORY } from '../../tokens'
import type { IOrganizationRepository } from '../../repositories'

@Injectable()
export class ActivateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(organizationId: string): Promise<void> {
    const organization =
      await this.organizationRepository.findById(organizationId)
    if (!organization) {
      throw new OrganizationNotFoundException(organizationId)
    }
    organization.isActive = true
    await this.organizationRepository.save(organization)
  }
}

import { Injectable, Inject } from '@nestjs/common'
import type { IOrganizationRepository } from '../repositories'
import { ORGANIZATION_REPOSITORY } from '../tokens'
import {
  NameAlreadyExistsException,
  NitAlreadyExistsException,
  OrganizationNotFoundException,
} from '../exceptions'
import { OrganizationEntity } from '../entities'

@Injectable()
export class OrganizationValidator {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async validateUniqueNit(nit: string, excludeId?: string): Promise<void> {
    const existing = await this.organizationRepository.findByNit(nit)

    if (existing && existing.id !== excludeId) {
      throw new NitAlreadyExistsException(nit)
    }
  }

  async validateUniqueName(name: string, excludeId?: string): Promise<void> {
    const existing = await this.organizationRepository.findByName(name)

    if (existing && existing.id !== excludeId) {
      throw new NameAlreadyExistsException(name)
    }
  }

  async validateAndGetOrganization(
    organizationId: string,
  ): Promise<OrganizationEntity> {
    const organization =
      await this.organizationRepository.findById(organizationId)
    if (!organization) {
      throw new OrganizationNotFoundException(organizationId)
    }
    return organization
  }

  async validateUniqueConstraints(
    name: string,
    nit: string,
    excludeId?: string,
  ): Promise<void> {
    await Promise.all([
      this.validateUniqueName(name, excludeId),
      this.validateUniqueNit(nit, excludeId),
    ])
  }
}

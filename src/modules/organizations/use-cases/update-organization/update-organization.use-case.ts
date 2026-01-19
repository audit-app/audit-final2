import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { UpdateOrganizationDto } from './update-organization.dto'
import { OrganizationEntity } from '../../entities/organization.entity'
import { OrganizationValidator } from '../../validators/organization.validator'
import { OrganizationFactory } from '../../factories/organization.factory'
import { OrganizationNotFoundException } from '../../exceptions'
import { ORGANIZATION_REPOSITORY } from '../../tokens'
import type { IOrganizationRepository } from '../../repositories'

/**
 * Caso de uso: Actualizar una organización existente
 * */
@Injectable()
export class UpdateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    private readonly validator: OrganizationValidator,
    private readonly organizationFactory: OrganizationFactory,
  ) {}

  @Transactional()
  async execute(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationEntity> {
    const organization = await this.organizationRepository.findById(id)
    if (!organization) {
      throw new OrganizationNotFoundException(id)
    }

    const validations: Promise<void>[] = []

    if (dto.name && dto.name !== organization.name) {
      validations.push(this.validator.validateUniqueName(dto.name, id))
    }

    if (dto.nit && dto.nit !== organization.nit) {
      validations.push(this.validator.validateUniqueNit(dto.nit, id))
    }

    if (validations.length > 0) {
      await Promise.all(validations)
    }

    const updatedOrganization = this.organizationFactory.updateFromDto(
      organization,
      dto,
    )

    return await this.organizationRepository.save(updatedOrganization)
  }
}

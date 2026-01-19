import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { FilesService } from '@core/files'
import { OrganizationValidator } from '../../validators'
import type { IOrganizationRepository } from '../../repositories'
import { ORGANIZATION_REPOSITORY } from '../../tokens'
import { OrganizationEntity } from '../../entities'

@Injectable()
export class DeleteLogoUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    private readonly organizationValidator: OrganizationValidator,
    private readonly filesService: FilesService,
  ) {}

  @Transactional()
  async execute(id: string): Promise<OrganizationEntity> {
    const organization =
      await this.organizationValidator.validateAndGetOrganization(id)
    if (organization.logoUrl) {
      await this.filesService.deleteFile(organization.logoUrl)
    }
    organization.removeLogo()
    return await this.organizationRepository.save(organization)
  }
}

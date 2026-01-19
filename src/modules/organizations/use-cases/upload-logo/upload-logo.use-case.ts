import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { FilesService, FileType } from '@core/files'
import { OrganizationEntity } from '../../entities/organization.entity'
import { ORGANIZATION_REPOSITORY } from '../../tokens'
import type { IOrganizationRepository } from '../../repositories'
import { OrganizationValidator } from '../../validators'

/**
 * Caso de uso: Subir logo de organización
 *
 * Responsabilidades:
 * - Verificar que la organización existe
 * - Reemplazar logo anterior si existe
 * - Validar formato y tamaño de imagen
 * - Actualizar URL de logo en organización
 */
@Injectable()
export class UploadLogoUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    private readonly filesService: FilesService,
    private readonly organizationValidator: OrganizationValidator,
  ) {}

  @Transactional()
  async execute(
    id: string,
    file: Express.Multer.File,
  ): Promise<OrganizationEntity> {
    const organization =
      await this.organizationValidator.validateAndGetOrganization(id)

    const uploadResult = await this.filesService.replaceFile(
      organization.logoUrl,
      {
        file,
        folder: 'organizations/logos',
        customFileName: `org-${id}`,
        overwrite: true,
        validationOptions: {
          fileType: FileType.IMAGE,
          maxSize: 5 * 1024 * 1024,
          maxWidth: 1024,
          maxHeight: 1024,
        },
      },
    )

    organization.updateLogo(uploadResult.filePath)
    return await this.organizationRepository.save(organization)
  }
}

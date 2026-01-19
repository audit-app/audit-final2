import { Module } from '@nestjs/common'
import { OrganizationsController } from './controllers/organizations.controller'
import { OrganizationValidator } from './validators/organization.validator'
import { OrganizationFactory } from './factories/organization.factory'
import {
  CreateOrganizationUseCase,
  UpdateOrganizationUseCase,
  FindOrganizationByIdUseCase,
  FindOrganizationsWithFiltersUseCase,
  UploadLogoUseCase,
  RemoveOrganizationUseCase,
  ActivateOrganizationUseCase,
  DeleteLogoUseCase,
  DeactivateOrganizationWithUsersUseCase,
} from './use-cases'

@Module({
  imports: [],
  controllers: [OrganizationsController],
  providers: [
    // Use Cases
    CreateOrganizationUseCase,
    UpdateOrganizationUseCase,
    FindOrganizationByIdUseCase,
    FindOrganizationsWithFiltersUseCase,
    UploadLogoUseCase,
    RemoveOrganizationUseCase,
    ActivateOrganizationUseCase,
    DeleteLogoUseCase,
    // Infrastructure
    OrganizationValidator,
    OrganizationFactory,
    DeactivateOrganizationWithUsersUseCase,
  ],
  exports: [],
})
export class OrganizationsModule {}

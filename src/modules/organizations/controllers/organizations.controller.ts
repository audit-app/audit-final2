import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  BadRequestException,
  Query,
  HttpCode,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UploadLogo } from '@core/files'
import {
  ApiCreate,
  ApiList,
  ApiFindOne,
  ApiUpdateWithMessage,
  ApiRemoveWithMessage,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiStandardResponses,
} from '@core/swagger'
import { UuidParamDto } from '@core/dtos'
import { ResponseMessage } from '@core/decorators'
import { OrganizationResponseDto } from '../dtos'
import {
  CreateOrganizationUseCase,
  CreateOrganizationDto,
} from '../use-cases/create-organization'
import {
  UpdateOrganizationUseCase,
  UpdateOrganizationDto,
} from '../use-cases/update-organization'
import {
  FindOrganizationsWithFiltersUseCase,
  FindOrganizationsDto,
  ORGANIZATION_SORTABLE_FIELDS,
  ORGANIZATION_SEARCH_FIELDS,
} from '../use-cases/find-organizations-with-filters'
import { FindOrganizationByIdUseCase } from '../use-cases/find-organization-by-id'
import { UploadLogoUseCase } from '../use-cases/upload-logo'
import { RemoveOrganizationUseCase } from '../use-cases/remove-organization'
import { ActivateOrganizationUseCase } from '../use-cases/activate-organization'
import { DeactivateOrganizationWithUsersUseCase } from '../use-cases/deactivate-organization-with-users'
import { DeleteLogoUseCase } from '../use-cases'

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
    private readonly findOrganizationByIdUseCase: FindOrganizationByIdUseCase,
    private readonly findOrganizationsWithFiltersUseCase: FindOrganizationsWithFiltersUseCase,
    private readonly uploadLogoUseCase: UploadLogoUseCase,
    private readonly removeOrganizationUseCase: RemoveOrganizationUseCase,
    private readonly deactivateOrganizationWithUsersUseCase: DeactivateOrganizationWithUsersUseCase,
    private readonly activateOrganizationUseCase: ActivateOrganizationUseCase,
    private readonly deleteLogoUseCase: DeleteLogoUseCase,
  ) {}

  @Post()
  @ApiCreate(OrganizationResponseDto, {
    summary: 'Crear una nueva organización',
    description:
      'Crea una nueva organización con sus datos básicos. El NIT y nombre deben ser únicos.',
    conflictMessage: 'Ya existe una organización con ese nombre o NIT',
  })
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return await this.createOrganizationUseCase.execute(createOrganizationDto)
  }

  @Get()
  @ApiList(OrganizationResponseDto, {
    summary: 'Listar organizaciones con paginación y filtros',
    searchFields: ORGANIZATION_SEARCH_FIELDS,
    sortableFields: ORGANIZATION_SORTABLE_FIELDS,
    defaultSortBy: 'createdAt',
    filterFields: [
      {
        name: 'isActive',
        description: 'Filtrar por estado activo/inactivo',
        type: 'boolean',
        example: 'true',
      },
      {
        name: 'hasLogo',
        description: 'Filtrar organizaciones con/sin logo',
        type: 'boolean',
        example: 'true',
      },
    ],
  })
  async findAll(@Query() query: FindOrganizationsDto) {
    return await this.findOrganizationsWithFiltersUseCase.execute(query)
  }

  @Get(':id')
  @ApiFindOne(OrganizationResponseDto)
  async findOne(@Param() { id }: UuidParamDto) {
    return await this.findOrganizationByIdUseCase.execute(id)
  }

  // OPCIÓN 1: Devolver entidad actualizada (RECOMENDADO para frontends modernos)
  // @Patch(':id')
  // @ApiUpdate(OrganizationResponseDto, {
  //   conflictMessage: 'Ya existe una organización con ese nombre o NIT',
  // })
  // async update(
  //   @Param() { id }: UuidParamDto,
  //   @Body() updateOrganizationDto: UpdateOrganizationDto,
  // ) {
  //   return await this.updateOrganizationUseCase.execute(
  //     id,
  //     updateOrganizationDto,
  //   )
  // }

  // OPCIÓN 2: Devolver mensaje genérico (más ligero)
  @Patch(':id')
  @ResponseMessage('Organización actualizada exitosamente')
  @ApiUpdateWithMessage({
    summary: 'Actualizar organización',
    description:
      'Actualiza los datos de una organización y retorna un mensaje de confirmación. El NIT y nombre deben ser únicos.',
    conflictMessage: 'Ya existe una organización con ese nombre o NIT',
  })
  async update(
    @Param() { id }: UuidParamDto,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    await this.updateOrganizationUseCase.execute(id, updateOrganizationDto)
  }

  @Post(':id/upload-logo')
  @HttpCode(200)
  @UploadLogo({
    maxSize: 5 * 1024 * 1024, // 5MB
  })
  @ApiOkResponse(OrganizationResponseDto, 'Logo subido exitosamente')
  @ApiNotFoundResponse('Organización no encontrada')
  @ApiStandardResponses()
  async uploadLogo(
    @Param() { id }: UuidParamDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Debe proporcionar un archivo de logo')
    }

    return await this.uploadLogoUseCase.execute(id, file)
  }

  @Delete(':id/image')
  @ApiNotFoundResponse('Organizacion no encontrado')
  @ApiStandardResponses()
  async deleteProfileImage(@Param() { id }: UuidParamDto) {
    return await this.deleteLogoUseCase.execute(id)
  }
  // OPCIÓN 1: Devolver entidad actualizada
  // @Patch(':id/deactivate')
  // @ApiCustom(OrganizationResponseDto, {
  //   summary: 'Desactivar una organización',
  //   description:
  //     'Cambia el estado de la organizacion a false y junto con ella a los usuarios de esa organizacion.',
  // })
  // async deactivate(@Param() { id }: UuidParamDto) {
  //   return await this.deactivateOrganizationWithUsersUseCase.execute(id)
  // }

  // OPCIÓN 2: Devolver mensaje genérico (usa TransformInterceptor + @ResponseMessage)
  @Patch(':id/deactivate')
  @ResponseMessage('Organización desactivada exitosamente')
  @ApiUpdateWithMessage({
    summary: 'Desactivar una organización',
    description:
      'Cambia el estado de la organización a inactivo junto con todos sus usuarios. Retorna un mensaje de confirmación.',
  })
  async deactivate(@Param() { id }: UuidParamDto) {
    await this.deactivateOrganizationWithUsersUseCase.execute(id)
  }

  // OPCIÓN 1: Devolver entidad actualizada
  // @Patch(':id/activate')
  // @ApiCustom(OrganizationResponseDto, {
  //   summary: 'Activar una organización',
  //   description:
  //     'Cambia el estado de la organización a true y retorna la organización actualizada.',
  // })
  // async activate(@Param() { id }: UuidParamDto) {
  //   return await this.activateOrganizationUseCase.execute(id)
  // }

  // OPCIÓN 2: Devolver mensaje genérico (usa TransformInterceptor + @ResponseMessage)
  @Patch(':id/activate')
  @ResponseMessage('Organización activada exitosamente')
  @ApiUpdateWithMessage({
    summary: 'Activar una organización',
    description:
      'Cambia el estado de la organización a activo y retorna un mensaje de confirmación.',
  })
  async activate(@Param() { id }: UuidParamDto) {
    await this.activateOrganizationUseCase.execute(id)
  }

  // OPCIÓN 1: Devolver entidad eliminada
  // @Delete(':id')
  // @ApiRemove(OrganizationResponseDto, {
  //   summary: 'Eliminar una organización (soft delete)',
  //   description:
  //     'Elimina una organización siempre que no tenga usuarios en bd. Retorna la organización desactivada para confirmación.',
  //   conflictMessage: 'La organización tiene usuarios activos',
  // })
  // async remove(@Param() { id }: UuidParamDto) {
  //   return await this.removeOrganizationUseCase.execute(id)
  // }

  // OPCIÓN 2: Devolver mensaje genérico
  @Delete(':id')
  @ResponseMessage('Organización eliminada exitosamente')
  @ApiRemoveWithMessage({
    summary: 'Eliminar una organización (soft delete)',
    description:
      'Elimina una organización siempre que no tenga usuarios. Retorna un mensaje de confirmación.',
    conflictMessage: 'La organización tiene usuarios activos',
  })
  async remove(@Param() { id }: UuidParamDto) {
    await this.removeOrganizationUseCase.execute(id)
  }
}

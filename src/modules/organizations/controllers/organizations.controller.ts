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
  ApiUpdate,
  ApiRemove,
  ApiCustom,
} from '@core/swagger'
import { UuidParamDto } from '@core/dtos'
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  FindOrganizationsDto,
  OrganizationResponseDto,
  ORGANIZATION_SORTABLE_FIELDS,
  ORGANIZATION_SEARCH_FIELDS,
} from '../dtos'
import {
  CreateOrganizationUseCase,
  UpdateOrganizationUseCase,
  FindOrganizationByIdUseCase,
  FindOrganizationsWithFiltersUseCase,
  UploadLogoUseCase,
  RemoveOrganizationUseCase,
  ActivateOrganizationUseCase,
  DeactivateOrganizationWithUsersUseCase,
} from '../use-cases'

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

  @Patch(':id')
  @ApiUpdate(OrganizationResponseDto, {
    conflictMessage: 'Ya existe una organización con ese nombre o NIT',
  })
  async update(
    @Param() { id }: UuidParamDto,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return await this.updateOrganizationUseCase.execute(
      id,
      updateOrganizationDto,
    )
  }

  @Post(':id/upload-logo')
  @UploadLogo({
    maxSize: 5 * 1024 * 1024, // 5MB
  })
  @ApiCustom(OrganizationResponseDto, {
    summary: 'Subir logo de la organización',
    description:
      'Sube o reemplaza el logo de la organización y retorna la organización actualizada. Formatos: JPG, PNG, WebP, SVG. Tamaño máximo: 5MB. Se redimensiona automáticamente si excede 1024x1024px.',
  })
  async uploadLogo(
    @Param() { id }: UuidParamDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Debe proporcionar un archivo de logo')
    }

    return await this.uploadLogoUseCase.execute(id, file)
  }

  @Patch(':id/deactivate')
  @ApiCustom(OrganizationResponseDto, {
    summary: 'Desactivar una organización',
    description:
      'Cambia el estado de la organizacion a false y junto con ella a los usuarios de esa organizacion.',
  })
  async deactivate(@Param() { id }: UuidParamDto) {
    return await this.deactivateOrganizationWithUsersUseCase.execute(id)
  }

  @Patch(':id/activate')
  @ApiCustom(OrganizationResponseDto, {
    summary: 'Activar una organización',
    description:
      'Cambia el estado de la organización a true y retorna la organización actualizada.',
  })
  async activate(@Param() { id }: UuidParamDto) {
    return await this.activateOrganizationUseCase.execute(id)
  }

  @Delete(':id')
  @ApiRemove(OrganizationResponseDto, {
    summary: 'Eliminar una organización (soft delete)',
    description:
      'Elimina una organización siempre que no tenga usuarios en bd. Retorna la organización desactivada para confirmación.',
    conflictMessage: 'La organización tiene usuarios activos',
  })
  @HttpCode(200)
  async remove(@Param() { id }: UuidParamDto) {
    return await this.removeOrganizationUseCase.execute(id)
  }
}

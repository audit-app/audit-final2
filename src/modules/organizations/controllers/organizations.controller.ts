import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { UploadLogo } from '@core/files'
import {
  ApiCreate,
  ApiList,
  ApiFindOne,
  ApiUpdate,
  ApiRemove,
  ApiCustom,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiStandardResponses,
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
  FindAllOrganizationsUseCase,
  FindOrganizationByIdUseCase,
  FindOrganizationByNitUseCase,
  FindOrganizationsWithFiltersUseCase,
  UploadLogoUseCase,
  RemoveOrganizationUseCase,
  DeleteOrganizationUseCase,
} from '../use-cases'

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
    private readonly findAllOrganizationsUseCase: FindAllOrganizationsUseCase,
    private readonly findOrganizationByIdUseCase: FindOrganizationByIdUseCase,
    private readonly findOrganizationByNitUseCase: FindOrganizationByNitUseCase,
    private readonly findOrganizationsWithFiltersUseCase: FindOrganizationsWithFiltersUseCase,
    private readonly uploadLogoUseCase: UploadLogoUseCase,
    private readonly removeOrganizationUseCase: RemoveOrganizationUseCase,
    private readonly deleteOrganizationUseCase: DeleteOrganizationUseCase,
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

  @Get('nit/:nit')
  @ApiCustom(OrganizationResponseDto, {
    summary: 'Obtener una organización por NIT',
    description:
      'Retorna los datos completos de una organización específica mediante su NIT.',
  })
  async findByNit(@Param('nit') nit: string) {
    return await this.findOrganizationByNitUseCase.execute(nit)
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
  @HttpCode(HttpStatus.OK)
  @UploadLogo({
    maxSize: 5 * 1024 * 1024, // 5MB
  })
  @ApiOperation({
    summary: 'Subir logo de la organización',
    description:
      'Sube o reemplaza el logo de la organización y retorna la organización actualizada. Formatos: JPG, PNG, WebP, SVG. Tamaño máximo: 5MB. Se redimensiona automáticamente si excede 1024x1024px.',
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

  @Delete(':id')
  @ApiRemove(OrganizationResponseDto, {
    summary: 'Desactivar una organización (soft delete)',
    description:
      'Desactiva una organización sin eliminarla de la base de datos. No se puede desactivar si tiene usuarios activos. Retorna la organización desactivada para confirmación.',
    conflictMessage: 'La organización tiene usuarios activos',
  })
  async remove(@Param() { id }: UuidParamDto) {
    return await this.removeOrganizationUseCase.execute(id)
  }
}

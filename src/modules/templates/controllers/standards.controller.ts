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
  Query,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import {
  ApiCreate,
  ApiUpdate,
  ApiCustom,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiStandardResponses,
} from '@core/swagger'
import { UuidParamDto } from '@core/dtos'
import { StandardsService } from '../services/standards.service'
import {
  CreateStandardDto,
  UpdateStandardDto,
  StandardResponseDto,
} from '../dtos'

@ApiTags('standards')
@Controller('standards')
export class StandardsController {
  constructor(private readonly standardsService: StandardsService) {}

  @Post()
  @ApiCreate(StandardResponseDto, {
    summary: 'Crear un nuevo estándar',
    description:
      'Crea un nuevo estándar o control dentro de una plantilla. El código debe ser único dentro de la plantilla.',
    conflictMessage: 'Ya existe un estándar con ese código en la plantilla',
  })
  async create(@Body() createStandardDto: CreateStandardDto) {
    return await this.standardsService.create(createStandardDto)
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los estándares',
    description:
      'Obtiene una lista de estándares con filtrado opcional por plantilla, estructura jerárquica y auditabilidad.',
  })
  @ApiOkResponse(StandardResponseDto, 'Lista de estándares', true)
  @ApiQuery({
    name: 'templateId',
    required: false,
    type: String,
    description: 'Filtrar por ID de plantilla',
  })
  @ApiQuery({
    name: 'tree',
    required: false,
    type: Boolean,
    description: 'Retornar estructura jerárquica (árbol)',
  })
  @ApiQuery({
    name: 'auditableOnly',
    required: false,
    type: Boolean,
    description: 'Filtrar solo estándares auditables',
  })
  @ApiStandardResponses({ exclude: [400] })
  async findAll(
    @Query('templateId') templateId?: string,
    @Query('tree') tree?: string,
    @Query('auditableOnly') auditableOnly?: string,
  ) {
    if (templateId && tree === 'true') {
      return await this.standardsService.findByTemplateTree(templateId)
    }

    if (templateId && auditableOnly === 'true') {
      return await this.standardsService.findAuditableByTemplate(templateId)
    }

    if (templateId) {
      return await this.standardsService.findByTemplate(templateId)
    }

    return await this.standardsService.findAll()
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un estándar por ID',
    description:
      'Retorna los datos completos de un estándar específico mediante su ID único.',
  })
  @ApiOkResponse(StandardResponseDto, 'Estándar encontrado')
  @ApiNotFoundResponse('Estándar no encontrado')
  @ApiStandardResponses({ exclude: [400] })
  async findOne(@Param() { id }: UuidParamDto) {
    return await this.standardsService.findOne(id)
  }

  @Get(':id/children')
  @ApiOperation({
    summary: 'Obtener estándares hijos de un estándar',
    description:
      'Retorna todos los estándares que son hijos directos de un estándar específico.',
  })
  @ApiOkResponse(StandardResponseDto, 'Lista de estándares hijos', true)
  @ApiNotFoundResponse('Estándar no encontrado')
  @ApiStandardResponses({ exclude: [400] })
  async findChildren(@Param() { id }: UuidParamDto) {
    return await this.standardsService.findChildren(id)
  }

  @Patch(':id')
  @ApiUpdate(StandardResponseDto, {
    summary: 'Actualizar un estándar',
    description:
      'Actualiza los datos de un estándar y retorna el estándar actualizado.',
    conflictMessage: 'Ya existe un estándar con ese código en la plantilla',
  })
  async update(
    @Param() { id }: UuidParamDto,
    @Body() updateStandardDto: UpdateStandardDto,
  ) {
    return await this.standardsService.update(id, updateStandardDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar un estándar',
    description:
      'Elimina permanentemente un estándar. No se puede eliminar si tiene estándares hijos. Retorna el estándar eliminado para confirmación.',
  })
  @ApiOkResponse(StandardResponseDto, 'Estándar eliminado exitosamente')
  @ApiNotFoundResponse('Estándar no encontrado')
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar un estándar con hijos',
  })
  @ApiStandardResponses({ exclude: [400] })
  async remove(@Param() { id }: UuidParamDto) {
    return await this.standardsService.remove(id)
  }

  @Patch(':id/deactivate')
  @ApiCustom(StandardResponseDto, {
    summary: 'Desactivar un estándar',
    description:
      'Cambia el estado isActive a false. Los estándares inactivos no aparecen en nuevas auditorías.',
  })
  async deactivate(@Param() { id }: UuidParamDto) {
    return await this.standardsService.deactivate(id)
  }

  @Patch(':id/activate')
  @ApiCustom(StandardResponseDto, {
    summary: 'Activar un estándar',
    description:
      'Cambia el estado isActive a true. Los estándares activos aparecen en nuevas auditorías.',
  })
  async activate(@Param() { id }: UuidParamDto) {
    return await this.standardsService.activate(id)
  }
}

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
  ApiFindOne,
  ApiUpdateWithMessage,
  ApiRemoveWithMessage,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiStandardResponses,
} from '@core/swagger'
import { UuidParamDto } from '@core/dtos'
import { ResponseMessage } from '@core/decorators'
import {
  CreateStandardDto,
  UpdateStandardDto,
  StandardResponseDto,
} from '../dtos'
import {
  CreateStandardUseCase,
  UpdateStandardUseCase,
  DeleteStandardUseCase,
  FindStandardUseCase,
  FindAllStandardsUseCase,
  FindStandardsByTemplateUseCase,
  FindStandardsTreeUseCase,
  FindStandardChildrenUseCase,
  FindAuditableStandardsUseCase,
  ActivateStandardUseCase,
  DeactivateStandardUseCase,
} from '../use-cases/standards'

@ApiTags('standards')
@Controller('standards')
export class StandardsController {
  constructor(
    private readonly createStandard: CreateStandardUseCase,
    private readonly updateStandard: UpdateStandardUseCase,
    private readonly deleteStandard: DeleteStandardUseCase,
    private readonly findStandard: FindStandardUseCase,
    private readonly findAllStandards: FindAllStandardsUseCase,
    private readonly findStandardsByTemplate: FindStandardsByTemplateUseCase,
    private readonly findStandardsTree: FindStandardsTreeUseCase,
    private readonly findStandardChildren: FindStandardChildrenUseCase,
    private readonly findAuditableStandards: FindAuditableStandardsUseCase,
    private readonly activateStandard: ActivateStandardUseCase,
    private readonly deactivateStandard: DeactivateStandardUseCase,
  ) {}

  @Post()
  @ApiCreate(StandardResponseDto, {
    summary: 'Crear un nuevo estándar',
    description:
      'Crea un nuevo estándar o control dentro de una plantilla. El código debe ser único dentro de la plantilla.',
    conflictMessage: 'Ya existe un estándar con ese código en la plantilla',
  })
  async create(@Body() createStandardDto: CreateStandardDto) {
    return await this.createStandard.execute(createStandardDto)
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
      return await this.findStandardsTree.execute(templateId)
    }

    if (templateId && auditableOnly === 'true') {
      return await this.findAuditableStandards.execute(templateId)
    }

    if (templateId) {
      return await this.findStandardsByTemplate.execute(templateId)
    }

    return await this.findAllStandards.execute()
  }

  @Get(':id')
  @ApiFindOne(StandardResponseDto)
  async findOne(@Param() { id }: UuidParamDto) {
    return await this.findStandard.execute(id)
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
    return await this.findStandardChildren.execute(id)
  }

  // OPCIÓN 1: Devolver entidad actualizada (RECOMENDADO para frontends modernos)
  // @Patch(':id')
  // @ApiUpdate(StandardResponseDto, {
  //   summary: 'Actualizar un estándar',
  //   description:
  //     'Actualiza los datos de un estándar y retorna el estándar actualizado.',
  //   conflictMessage: 'Ya existe un estándar con ese código en la plantilla',
  // })
  // async update(
  //   @Param() { id }: UuidParamDto,
  //   @Body() updateStandardDto: UpdateStandardDto,
  // ) {
  //   return await this.standardsService.update(id, updateStandardDto)
  // }

  // OPCIÓN 2: Devolver mensaje genérico (más ligero)
  @Patch(':id')
  @ResponseMessage('Estándar actualizado exitosamente')
  @ApiUpdateWithMessage({
    summary: 'Actualizar un estándar',
    description:
      'Actualiza los datos de un estándar y retorna un mensaje de confirmación.',
    conflictMessage: 'Ya existe un estándar con ese código en la plantilla',
  })
  async update(
    @Param() { id }: UuidParamDto,
    @Body() updateStandardDto: UpdateStandardDto,
  ) {
    await this.updateStandard.execute(id, updateStandardDto)
  }

  // OPCIÓN 1: Devolver entidad eliminada
  // @Delete(':id')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({
  //   summary: 'Eliminar un estándar',
  //   description:
  //     'Elimina permanentemente un estándar. No se puede eliminar si tiene estándares hijos. Retorna el estándar eliminado para confirmación.',
  // })
  // @ApiOkResponse(StandardResponseDto, 'Estándar eliminado exitosamente')
  // @ApiNotFoundResponse('Estándar no encontrado')
  // @ApiResponse({
  //   status: 409,
  //   description: 'No se puede eliminar un estándar con hijos',
  // })
  // @ApiStandardResponses({ exclude: [400] })
  // async remove(@Param() { id }: UuidParamDto) {
  //   return await this.standardsService.remove(id)
  // }

  // OPCIÓN 2: Devolver mensaje genérico
  @Delete(':id')
  @ResponseMessage('Estándar eliminado exitosamente')
  @ApiRemoveWithMessage({
    summary: 'Eliminar un estándar',
    description:
      'Elimina permanentemente un estándar. No se puede eliminar si tiene estándares hijos. Retorna un mensaje de confirmación.',
    conflictMessage: 'No se puede eliminar un estándar con hijos',
  })
  async remove(@Param() { id }: UuidParamDto) {
    await this.deleteStandard.execute(id)
  }

  // OPCIÓN 1: Devolver entidad actualizada
  // @Patch(':id/deactivate')
  // @ApiCustom(StandardResponseDto, {
  //   summary: 'Desactivar un estándar',
  //   description:
  //     'Cambia el estado isActive a false. Los estándares inactivos no aparecen en nuevas auditorías.',
  // })
  // async deactivate(@Param() { id }: UuidParamDto) {
  //   return await this.standardsService.deactivate(id)
  // }

  // OPCIÓN 2: Devolver mensaje genérico (usa TransformInterceptor + @ResponseMessage)
  @Patch(':id/deactivate')
  @ResponseMessage('Estándar desactivado exitosamente')
  @ApiUpdateWithMessage({
    summary: 'Desactivar un estándar',
    description:
      'Cambia el estado isActive a false. Los estándares inactivos no aparecen en nuevas auditorías. Retorna un mensaje de confirmación.',
  })
  async deactivate(@Param() { id }: UuidParamDto) {
    await this.deactivateStandard.execute(id)
  }

  // OPCIÓN 1: Devolver entidad actualizada
  // @Patch(':id/activate')
  // @ApiCustom(StandardResponseDto, {
  //   summary: 'Activar un estándar',
  //   description:
  //     'Cambia el estado isActive a true. Los estándares activos aparecen en nuevas auditorías.',
  // })
  // async activate(@Param() { id }: UuidParamDto) {
  //   return await this.standardsService.activate(id)
  // }

  // OPCIÓN 2: Devolver mensaje genérico (usa TransformInterceptor + @ResponseMessage)
  @Patch(':id/activate')
  @ResponseMessage('Estándar activado exitosamente')
  @ApiUpdateWithMessage({
    summary: 'Activar un estándar',
    description:
      'Cambia el estado isActive a true. Los estándares activos aparecen en nuevas auditorías. Retorna un mensaje de confirmación.',
  })
  async activate(@Param() { id }: UuidParamDto) {
    await this.activateStandard.execute(id)
  }
}

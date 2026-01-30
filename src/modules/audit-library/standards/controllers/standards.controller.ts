import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
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
import { ResponseMessage } from '@core/http'
import {
  CreateStandardDto,
  UpdateStandardDto,
  StandardResponseDto,
  ReorderStandardDto,
  FindStandardsDto,
} from '../dtos'
import {
  CreateStandardUseCase,
  UpdateStandardUseCase,
  DeleteStandardUseCase,
  FindStandardUseCase,
  ReorderStandardUseCase,
  ActivateAuditableUseCase,
  DeactivateAuditableUseCase,
  GetTemplateStandardsTreeUseCase,
} from '../use-cases'

@ApiTags('standards')
@Controller('standards')
export class StandardsController {
  constructor(
    private readonly createStandard: CreateStandardUseCase,
    private readonly updateStandard: UpdateStandardUseCase,
    private readonly deleteStandard: DeleteStandardUseCase,
    private readonly findStandard: FindStandardUseCase,
    private readonly getTemplatesTreeUseCase: GetTemplateStandardsTreeUseCase,
    private readonly reorderStandard: ReorderStandardUseCase,
    private readonly activateAuditable: ActivateAuditableUseCase,
    private readonly deactivateAuditable: DeactivateAuditableUseCase,
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

  @Get(':id')
  @ApiFindOne(StandardResponseDto)
  async findOne(@Param() { id }: UuidParamDto) {
    return await this.findStandard.execute(id)
  }

  @Get()
  async getTree(@Query() findStandardDto: FindStandardsDto) {
    return await this.getTemplatesTreeUseCase.execute(findStandardDto)
  }

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

  @Patch(':id/reorder')
  @ApiOperation({
    summary: 'Cambiar orden de un estándar',
    description:
      'Cambia el orden de visualización de un estándar entre sus hermanos. Útil para drag & drop en la interfaz.',
  })
  @ApiOkResponse(StandardResponseDto, 'Estándar reordenado exitosamente')
  @ApiNotFoundResponse('Estándar no encontrado')
  @ApiStandardResponses({ exclude: [200, 404] })
  async reorder(
    @Param() { id }: UuidParamDto,
    @Body() reorderDto: ReorderStandardDto,
  ) {
    return await this.reorderStandard.execute(id, reorderDto)
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activar si un estándar es auditable',
    description:
      'Marca un estándar como auditable (control evaluable) o no auditable (solo agrupador organizacional).',
  })
  @ApiOkResponse(
    StandardResponseDto,
    'Estado auditable actualizado exitosamente',
  )
  @ApiNotFoundResponse('Estándar no encontrado')
  @ApiStandardResponses({ exclude: [200, 404] })
  async activate(@Param() { id }: UuidParamDto) {
    return await this.activateAuditable.execute(id)
  }

  @Patch(':id/toggle-auditable')
  @ApiOperation({
    summary: 'Activar/desactivar si un estándar es auditable',
    description:
      'Marca un estándar como auditable (control evaluable) o no auditable (solo agrupador organizacional).',
  })
  @ApiOkResponse(
    StandardResponseDto,
    'Estado auditable actualizado exitosamente',
  )
  @ApiNotFoundResponse('Estándar no encontrado')
  @ApiStandardResponses({ exclude: [200, 404] })
  async deactivate(@Param() { id }: UuidParamDto) {
    return await this.deactivateAuditable.execute(id)
  }
}

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
  ApiRemoveNoContent,
  ApiOkResponse,
  ApiStandardResponses,
} from '@core/swagger'
import { UuidParamDto } from '@core/dtos'
import { ResponseMessage } from '@core/decorators'
import {
  CreateMaturityFrameworkDto,
  UpdateMaturityFrameworkDto,
  FindMaturityFrameworksDto,
} from '../dtos'
import { MaturityFrameworkEntity } from '../entities/maturity-framework.entity'
import {
  CreateFrameworkUseCase,
  UpdateFrameworkUseCase,
  FindFrameworkUseCase,
  FindFrameworksUseCase,
  DeleteFrameworkUseCase,
  ActivateFrameworkUseCase,
  DeactivateFrameworkUseCase,
} from '../use-cases'

@ApiTags('maturity-frameworks')
@Controller('maturity/frameworks')
export class MaturityFrameworksController {
  constructor(
    private readonly createFrameworkUseCase: CreateFrameworkUseCase,
    private readonly updateFrameworkUseCase: UpdateFrameworkUseCase,
    private readonly findFrameworkUseCase: FindFrameworkUseCase,
    private readonly findFrameworksUseCase: FindFrameworksUseCase,
    private readonly deleteFrameworkUseCase: DeleteFrameworkUseCase,
    private readonly activateFrameworkUseCase: ActivateFrameworkUseCase,
    private readonly deactivateFrameworkUseCase: DeactivateFrameworkUseCase,
  ) {}

  @Post()
  @ApiCreate(MaturityFrameworkEntity, {
    summary: 'Crear un nuevo framework de madurez',
    description:
      'Crea un nuevo framework de madurez (ej: COBIT 5, CMMI). El código debe ser único.',
    conflictMessage: 'Framework con ese código ya existe',
  })
  async create(@Body() dto: CreateMaturityFrameworkDto) {
    return await this.createFrameworkUseCase.execute(dto)
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los frameworks de madurez',
    description: 'Retorna una lista de frameworks con filtros opcionales.',
  })
  @ApiOkResponse(MaturityFrameworkEntity, 'Lista de frameworks')
  @ApiStandardResponses({ exclude: [400] })
  async findAll(@Query() query: FindMaturityFrameworksDto) {
    return await this.findFrameworksUseCase.execute(query)
  }

  @Get(':id')
  @ApiFindOne(MaturityFrameworkEntity, {
    summary: 'Obtener un framework por ID con sus niveles',
    description:
      'Retorna los datos completos del framework incluyendo sus niveles de madurez.',
  })
  async findOne(@Param() { id }: UuidParamDto) {
    return await this.findFrameworkUseCase.execute(id, true)
  }

  // OPCIÓN 1: Devolver entidad actualizada (RECOMENDADO para frontends modernos)
  // @Patch(':id')
  // @ApiUpdate(MaturityFrameworkEntity, {
  //   summary: 'Actualizar un framework de madurez',
  //   conflictMessage: 'Framework con ese código ya existe',
  // })
  // async update(
  //   @Param() { id }: UuidParamDto,
  //   @Body() dto: UpdateMaturityFrameworkDto,
  // ) {
  //   return await this.updateFrameworkUseCase.execute(id, dto)
  // }

  // OPCIÓN 2: Devolver mensaje genérico (más ligero)
  @Patch(':id')
  @ResponseMessage('Framework de madurez actualizado exitosamente')
  @ApiUpdateWithMessage({
    summary: 'Actualizar un framework de madurez',
    description:
      'Actualiza los datos de un framework y retorna un mensaje de confirmación.',
    conflictMessage: 'Framework con ese código ya existe',
  })
  async update(
    @Param() { id }: UuidParamDto,
    @Body() dto: UpdateMaturityFrameworkDto,
  ) {
    await this.updateFrameworkUseCase.execute(id, dto)
  }

  @Delete(':id')
  @ApiRemoveNoContent({
    summary: 'Eliminar un framework de madurez',
    description:
      'Elimina permanentemente un framework de madurez sin devolver contenido.',
  })
  async remove(@Param() { id }: UuidParamDto) {
    await this.deleteFrameworkUseCase.execute(id)
  }

  // OPCIÓN 1: Devolver entidad actualizada
  // @Patch(':id/activate')
  // @ApiCustom(MaturityFrameworkEntity, {
  //   summary: 'Activar un framework de madurez',
  //   description: 'Cambia el estado isActive a true.',
  // })
  // async activate(@Param() { id }: UuidParamDto) {
  //   return await this.activateFrameworkUseCase.execute(id, true)
  // }

  // OPCIÓN 2: Devolver mensaje genérico (usa TransformInterceptor + @ResponseMessage)
  @Patch(':id/activate')
  @ResponseMessage('Framework de madurez activado exitosamente')
  @ApiUpdateWithMessage({
    summary: 'Activar un framework de madurez',
    description:
      'Cambia el estado isActive a true. Retorna un mensaje de confirmación.',
  })
  async activate(@Param() { id }: UuidParamDto) {
    await this.activateFrameworkUseCase.execute(id)
  }

  @Patch(':id/deactivate')
  @ResponseMessage('Framework de madurez desactivado exitosamente')
  @ApiUpdateWithMessage({
    summary: 'Desactivar un framework de madurez',
    description:
      'Cambia el estado isActive a false. Retorna un mensaje de confirmación.',
  })
  async deactivate(@Param() { id }: UuidParamDto) {
    await this.deactivateFrameworkUseCase.execute(id)
  }
}

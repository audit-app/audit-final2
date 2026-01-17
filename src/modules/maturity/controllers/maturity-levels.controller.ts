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
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import {
  ApiCreate,
  ApiUpdateWithMessage,
  ApiRemoveNoContent,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiStandardResponses,
} from '@core/swagger'
import { UuidParamDto } from '@core/dtos'
import { ResponseMessage } from '@core/decorators'
import {
  CreateMaturityLevelDto,
  UpdateMaturityLevelDto,
  BulkCreateMaturityLevelsDto,
} from '../dtos'
import { MaturityLevelEntity } from '../entities/maturity-level.entity'
import {
  CreateLevelUseCase,
  UpdateLevelUseCase,
  DeleteLevelUseCase,
  FindLevelsByFrameworkUseCase,
  BulkCreateLevelsUseCase,
} from '../use-cases'

@ApiTags('maturity-levels')
@Controller('maturity')
export class MaturityLevelsController {
  constructor(
    private readonly createLevelUseCase: CreateLevelUseCase,
    private readonly updateLevelUseCase: UpdateLevelUseCase,
    private readonly deleteLevelUseCase: DeleteLevelUseCase,
    private readonly findLevelsByFrameworkUseCase: FindLevelsByFrameworkUseCase,
    private readonly bulkCreateLevelsUseCase: BulkCreateLevelsUseCase,
  ) {}

  @Post('levels')
  @ApiCreate(MaturityLevelEntity, {
    summary: 'Crear un nuevo nivel de madurez',
    description:
      'Crea un nuevo nivel de madurez dentro de un framework. El número de nivel debe ser único dentro del framework.',
    conflictMessage: 'Nivel ya existe en el framework',
  })
  async create(@Body() dto: CreateMaturityLevelDto) {
    return await this.createLevelUseCase.execute(dto)
  }

  @Post('levels/bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear múltiples niveles de madurez (reemplaza existentes)',
    description:
      'Crea múltiples niveles de madurez para un framework. Los niveles existentes del framework serán reemplazados.',
  })
  @ApiResponse({
    status: 201,
    description: 'Niveles creados exitosamente',
  })
  @ApiNotFoundResponse('Framework no encontrado')
  @ApiStandardResponses()
  async bulkCreate(@Body() dto: BulkCreateMaturityLevelsDto) {
    return await this.bulkCreateLevelsUseCase.execute(dto)
  }

  @Get('frameworks/:frameworkId/levels')
  @ApiOperation({
    summary: 'Obtener todos los niveles de un framework',
    description:
      'Retorna todos los niveles de madurez asociados a un framework específico.',
  })
  @ApiOkResponse(MaturityLevelEntity, 'Lista de niveles', true)
  @ApiNotFoundResponse('Framework no encontrado')
  @ApiStandardResponses({ exclude: [400] })
  async findByFramework(@Param('frameworkId') frameworkId: string) {
    return await this.findLevelsByFrameworkUseCase.execute(frameworkId)
  }

  // OPCIÓN 1: Devolver entidad actualizada (RECOMENDADO para frontends modernos)
  // @Patch('levels/:id')
  // @ApiUpdate(MaturityLevelEntity, {
  //   summary: 'Actualizar un nivel de madurez',
  //   conflictMessage: 'Nivel con ese número ya existe en el framework',
  // })
  // async update(
  //   @Param() { id }: UuidParamDto,
  //   @Body() dto: UpdateMaturityLevelDto,
  // ) {
  //   return await this.updateLevelUseCase.execute(id, dto)
  // }

  // OPCIÓN 2: Devolver mensaje genérico (más ligero)
  @Patch('levels/:id')
  @ResponseMessage('Nivel de madurez actualizado exitosamente')
  @ApiUpdateWithMessage({
    summary: 'Actualizar un nivel de madurez',
    description:
      'Actualiza los datos de un nivel de madurez y retorna un mensaje de confirmación.',
    conflictMessage: 'Nivel con ese número ya existe en el framework',
  })
  async update(
    @Param() { id }: UuidParamDto,
    @Body() dto: UpdateMaturityLevelDto,
  ) {
    await this.updateLevelUseCase.execute(id, dto)
  }

  @Delete('levels/:id')
  @ApiRemoveNoContent({
    summary: 'Eliminar un nivel de madurez',
    description:
      'Elimina permanentemente un nivel de madurez sin devolver contenido.',
  })
  async remove(@Param() { id }: UuidParamDto) {
    await this.deleteLevelUseCase.execute(id)
  }
}

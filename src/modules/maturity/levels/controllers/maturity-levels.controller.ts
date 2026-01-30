import { Controller, Get, Body, Patch, Param } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import {
  ApiUpdateWithMessage,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiStandardResponses,
} from '@core/swagger'
import { UuidParamDto } from '@core/dtos'
import { ResponseMessage } from '@core/http'
import { UpdateMaturityLevelDto } from '../dtos'
import { MaturityLevelEntity } from '../entities/maturity-level.entity'
import {
  UpdateLevelUseCase,
  FindLevelUseCase,
  FindLevelsByFrameworkUseCase,
} from '../use-cases'

/**
 * Maturity Levels Controller
 *
 * Solo permite consultar y editar niveles existentes.
 * Los niveles se crean OBLIGATORIAMENTE junto con el framework (creación atómica).
 */
@ApiTags('maturity-levels')
@Controller('maturity')
export class MaturityLevelsController {
  constructor(
    private readonly updateLevelUseCase: UpdateLevelUseCase,
    private readonly findLevelUseCase: FindLevelUseCase,
    private readonly findLevelsByFrameworkUseCase: FindLevelsByFrameworkUseCase,
  ) {}

  @Get('levels/:id')
  @ApiOperation({
    summary: 'Obtener un nivel de madurez por ID',
    description:
      'Retorna los datos de un nivel de madurez específico. Útil para obtener los datos antes de editarlo.',
  })
  @ApiOkResponse(MaturityLevelEntity, 'Nivel de madurez encontrado')
  @ApiNotFoundResponse('Nivel de madurez no encontrado')
  @ApiStandardResponses({ exclude: [400] })
  async findOne(@Param() { id }: UuidParamDto) {
    return await this.findLevelUseCase.execute(id)
  }

  @Get('frameworks/:frameworkId/levels')
  @ApiOperation({
    summary: 'Obtener todos los niveles de un framework',
    description:
      'Retorna todos los niveles de madurez asociados a un framework específico.',
  })
  @ApiOkResponse(MaturityLevelEntity, 'Lista de niveles')
  @ApiNotFoundResponse('Framework no encontrado')
  @ApiStandardResponses({ exclude: [400] })
  async findByFramework(@Param('frameworkId') frameworkId: string) {
    return await this.findLevelsByFrameworkUseCase.execute(frameworkId)
  }

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
}

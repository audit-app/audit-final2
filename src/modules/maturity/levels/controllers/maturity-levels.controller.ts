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
    // private readonly createLevelUseCase: CreateLevelUseCase, // ❌ ELIMINADO - No se permite crear levels sueltos
    private readonly updateLevelUseCase: UpdateLevelUseCase,
    // private readonly deleteLevelUseCase: DeleteLevelUseCase, // ❌ ELIMINADO - No se permite eliminar levels individuales
    private readonly findLevelsByFrameworkUseCase: FindLevelsByFrameworkUseCase,
    // private readonly bulkCreateLevelsUseCase: BulkCreateLevelsUseCase, // ❌ ELIMINADO - No se necesita bulk replace
  ) {}

  // ❌ ENDPOINT ELIMINADO - Los levels se crean SOLO junto con el framework
  // @Post('levels')
  // async create(@Body() dto: CreateMaturityLevelDto) {
  //   return await this.createLevelUseCase.execute(dto)
  // }
  //
  // JUSTIFICACIÓN:
  // - Los levels son parte integral del framework
  // - No tiene sentido crear levels sueltos
  // - Podría romper la integridad del rango (minLevel-maxLevel)

  // ❌ ENDPOINT ELIMINADO - No se necesita reemplazar todos los levels
  // @Post('levels/bulk')
  // async bulkCreate(@Body() dto: BulkCreateMaturityLevelsDto) {
  //   return await this.bulkCreateLevelsUseCase.execute(dto)
  // }
  //
  // JUSTIFICACIÓN:
  // - El usuario indicó que solo necesita crear + editar
  // - Si quiere cambiar la estructura completa, puede eliminar el framework y crear uno nuevo
  // - Esto simplifica la lógica y evita inconsistencias

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

  // ❌ ENDPOINT ELIMINADO - No se permite eliminar levels individuales
  // @Delete('levels/:id')
  // async remove(@Param() { id }: UuidParamDto) {
  //   await this.deleteLevelUseCase.execute(id)
  // }
  //
  // JUSTIFICACIÓN:
  // - Eliminar un level rompe la escala de madurez (ej: 0,1,2,[FALTA 3],4,5)
  // - Las auditorías que usan ese framework quedan inconsistentes
  // - Si quiere cambiar la estructura, debe eliminar el framework completo
  //   y crear uno nuevo con la estructura correcta
}

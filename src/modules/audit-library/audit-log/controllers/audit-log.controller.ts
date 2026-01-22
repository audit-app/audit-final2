import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger'
import { UuidParamDto } from '@core/dtos'
import { GetAuditHistoryUseCase } from '../use-cases'
import { GetAuditHistoryDto } from '../dtos'
import { AuditLogEntity } from '../entities'

/**
 * Audit Log Controller
 *
 * Endpoints para consultar el historial de cambios de templates y standards
 */
@ApiTags('audit-log')
@Controller('audit-log')
export class AuditLogController {
  constructor(
    private readonly getAuditHistoryUseCase: GetAuditHistoryUseCase,
  ) {}

  /**
   * GET /audit-log/:rootId
   *
   * Obtiene el historial completo de cambios de una plantilla
   * (incluyendo todos sus standards)
   */
  @Get(':rootId')
  @ApiOperation({
    summary: 'Obtener historial de auditoría de una plantilla',
    description:
      'Retorna todos los cambios realizados en una plantilla y sus standards, ordenados por fecha descendente. ' +
      'Incluye información del usuario que realizó cada cambio, el tipo de acción (CREATE, UPDATE, DELETE, etc.) y los cambios específicos realizados.',
  })
  @ApiParam({
    name: 'rootId',
    description: 'ID del template para obtener su historial completo',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de auditoría obtenido exitosamente',
    type: [AuditLogEntity],
  })
  @ApiResponse({
    status: 400,
    description: 'ID de template inválido',
  })
  async getHistory(
    @Param('rootId') rootId: string,
    @Query('limit') limit?: number,
  ): Promise<AuditLogEntity[]> {
    const dto: GetAuditHistoryDto = {
      rootId,
      limit: limit ? Number(limit) : undefined,
    }

    return await this.getAuditHistoryUseCase.execute(dto)
  }
}

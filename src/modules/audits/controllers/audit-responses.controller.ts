import { Controller, Get, Patch, Body, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger'
import { UuidParamDto } from '@core/dtos'
import { ResponseMessage } from '@core/http'
import {
  ApiFindOne,
  ApiUpdate,
} from '@core/swagger/decorators/api-crud.decorator'
import { UpdateResponseDto, ResponseResponseDto } from '../dtos'
import {
  UpdateResponseUseCase,
  ListResponsesUseCase,
  GetResponseUseCase,
  GetAuditStatsUseCase,
} from '../use-cases'
import type { AuditStats } from '../use-cases/get-audit-stats'

/**
 * Controlador para gestionar respuestas/evaluaciones de estándares en auditorías
 *
 * Rutas base: /audits/:auditId/responses
 *
 * Funcionalidades:
 * - Listar respuestas de una auditoría (GET /)
 * - Obtener respuesta específica (GET /:responseId)
 * - Actualizar evaluación de estándar (PATCH /:responseId)
 * - Obtener estadísticas y scores (GET /stats)
 *
 * Permisos requeridos: Roles de auditoría (LEAD_AUDITOR, AUDITOR)
 * Nota: La autorización se implementará en guards posteriores
 */
@ApiTags('Audits - Evaluaciones')
@Controller('audits/:auditId/responses')
export class AuditResponsesController {
  constructor(
    private readonly updateResponseUseCase: UpdateResponseUseCase,
    private readonly listResponsesUseCase: ListResponsesUseCase,
    private readonly getResponseUseCase: GetResponseUseCase,
    private readonly getAuditStatsUseCase: GetAuditStatsUseCase,
  ) {}

  /**
   * Listar todas las respuestas/evaluaciones de una auditoría
   *
   * Retorna lista completa de estándares con:
   * - Información del estándar (código, nombre, descripción)
   * - Estado de evaluación (NOT_STARTED, IN_PROGRESS, COMPLETED, REVIEWED)
   * - Score y compliance level (si ya fue evaluado)
   * - Nivel de madurez alcanzado
   * - Cantidad de work papers adjuntos
   *
   * Útil para:
   * - Dashboard de auditoría
   * - Ver progreso de evaluaciones
   * - Listar estándares pendientes/completados
   */
  @Get()
  @ApiOperation({ summary: 'Listar respuestas/evaluaciones de auditoría' })
  @ApiParam({
    name: 'auditId',
    description: 'ID de la auditoría',
    type: 'string',
    format: 'uuid',
  })
  @ResponseMessage('Respuestas obtenidas exitosamente')
  async list(@Param() { id: auditId }: UuidParamDto) {
    return await this.listResponsesUseCase.execute(auditId)
  }

  /**
   * Obtener una respuesta/evaluación específica
   *
   * Retorna información completa de la evaluación de un estándar:
   * - Datos del estándar evaluado
   * - Score, compliance level, nivel de madurez
   * - Hallazgos y recomendaciones
   * - Work papers adjuntos (evidencia)
   * - Auditor asignado
   * - Revisión (si aplicable)
   *
   * Útil para:
   * - Ver detalle de evaluación
   * - Editar evaluación
   * - Revisar evidencia
   */
  @Get(':responseId')
  @ApiFindOne(ResponseResponseDto, {
    summary: 'Obtener respuesta/evaluación específica',
    description:
      'Obtiene el detalle completo de la evaluación de un estándar en una auditoría',
  })
  @ApiParam({
    name: 'auditId',
    description: 'ID de la auditoría',
    type: 'string',
    format: 'uuid',
  })
  @ApiParam({
    name: 'responseId',
    description: 'ID de la respuesta/evaluación',
    type: 'string',
    format: 'uuid',
  })
  async findOne(
    @Param('auditId') auditId: string,
    @Param('responseId') responseId: string,
  ) {
    return await this.getResponseUseCase.execute(auditId, responseId)
  }

  /**
   * Actualizar evaluación de un estándar
   *
   * Permite actualizar:
   * - Estado (NOT_STARTED → IN_PROGRESS → COMPLETED → REVIEWED)
   * - Score (0-100)
   * - Nivel de cumplimiento (COMPLIANT, PARTIAL, NON_COMPLIANT, NOT_APPLICABLE)
   * - Nivel de madurez alcanzado (0-5 según framework)
   * - Hallazgos (findings)
   * - Recomendaciones (recommendations)
   * - Notas internas
   * - Auditor asignado
   *
   * Validaciones:
   * - Auditoría debe estar IN_PROGRESS (no cerrada)
   * - Score debe estar en rango 0-100
   * - Nivel de madurez debe estar en rango 0-5
   *
   * Nota: updatedBy se aplica automáticamente vía CLS
   */
  @Patch(':responseId')
  @ApiUpdate(ResponseResponseDto, {
    summary: 'Actualizar evaluación de estándar',
    description:
      'Actualiza la evaluación de un estándar: score, compliance, hallazgos, recomendaciones',
  })
  @ApiParam({
    name: 'auditId',
    description: 'ID de la auditoría',
    type: 'string',
    format: 'uuid',
  })
  @ApiParam({
    name: 'responseId',
    description: 'ID de la respuesta/evaluación',
    type: 'string',
    format: 'uuid',
  })
  @ResponseMessage('Evaluación actualizada exitosamente')
  async update(
    @Param('auditId') auditId: string,
    @Param('responseId') responseId: string,
    @Body() dto: UpdateResponseDto,
  ) {
    return await this.updateResponseUseCase.execute(auditId, responseId, dto)
  }
}

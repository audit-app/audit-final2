import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger'
import type { Response } from 'express'
import { GenerateComplianceReportUseCase } from '../use-cases/generate-compliance-report.use-case'
import { GenerateComplianceReportDto } from '../dtos/generate-compliance-report.dto'
import { Public } from '@core'

/**
 * Controlador para generar reportes de auditorías
 *
 * Rutas base: /audits/:auditId/reports
 *
 * Funcionalidades:
 * - Generar reporte de cumplimiento en formato DOCX
 * - Incluir gráficas radiales, barras y donas
 * - Exportar hallazgos y recomendaciones
 *
 * @example
 * GET /api/audits/123e4567-e89b-12d3-a456-426614174000/reports/compliance
 */
@Public()
@ApiTags('Audit Reports')
@Controller('audits/:auditId/reports')
export class AuditReportsController {
  constructor(
    private readonly generateComplianceReportUseCase: GenerateComplianceReportUseCase,
  ) {}

  /**
   * Genera un reporte de cumplimiento en formato DOCX
   *
   * @param auditId - ID de la auditoría
   * @param options - Opciones para generar el reporte
   * @param res - Response de Express para configurar headers
   * @returns Archivo DOCX descargable
   */
  @Get('compliance')
  @ApiOperation({
    summary: 'Generar reporte de cumplimiento',
    description: `
      Genera un documento DOCX profesional con el reporte de cumplimiento de la auditoría.

      El reporte incluye:
      - Portada con datos de la auditoría
      - Resumen ejecutivo con métricas
      - Gráficas radiales de cumplimiento por área
      - Gráficas de barras de ponderaciones vs scores
      - Gráfica de dona de niveles de cumplimiento
      - Gráfica de gauge de cumplimiento global
      - Tabla detallada de estándares evaluados
      - Hallazgos y recomendaciones por estándar
    `,
  })
  @ApiParam({
    name: 'auditId',
    description: 'ID de la auditoría',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'includeRadarChart',
    required: false,
    type: Boolean,
    description: 'Incluir gráfica radial',
    example: true,
  })
  @ApiQuery({
    name: 'includeWeightedBarChart',
    required: false,
    type: Boolean,
    description: 'Incluir gráfica de barras de ponderaciones',
    example: true,
  })
  @ApiQuery({
    name: 'includeComplianceDoughnut',
    required: false,
    type: Boolean,
    description: 'Incluir gráfica de dona',
    example: true,
  })
  @ApiQuery({
    name: 'includeGaugeChart',
    required: false,
    type: Boolean,
    description: 'Incluir gráfica de gauge',
    example: true,
  })
  @ApiQuery({
    name: 'includeDetailedTable',
    required: false,
    type: Boolean,
    description: 'Incluir tabla detallada',
    example: true,
  })
  @ApiQuery({
    name: 'includeFindingsAndRecommendations',
    required: false,
    type: Boolean,
    description: 'Incluir hallazgos y recomendaciones',
    example: true,
  })
  @ApiQuery({
    name: 'theme',
    required: false,
    type: String,
    description: 'Tema del reporte',
    example: 'modern',
  })
  async generateComplianceReport(
    @Param('auditId') auditId: string,
    @Query() options: GenerateComplianceReportDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Generar reporte
    const buffer = await this.generateComplianceReportUseCase.execute(
      auditId,
      options,
    )

    // Configurar headers para descarga
    const filename = `Reporte-Cumplimiento-${auditId}-${Date.now()}.docx`
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    })

    return new StreamableFile(buffer)
  }
}

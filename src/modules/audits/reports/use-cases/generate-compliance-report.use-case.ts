import { Inject, Injectable } from '@nestjs/common'
import {
  SimpleDocumentBuilderService,
  createHeadingSection,
  createImageSection,
  createTableSection,
  createPageBreakSection,
  createParagraphSection,
  createHeaderFooter,
  createTextContent,
  createPageNumberContent,
  MODERN_THEME,
} from '@core/reports'
import type { DocumentSection } from '@core/reports/interfaces'
import { AUDITS_REPOSITORY, AUDIT_RESPONSES_REPOSITORY } from '../../tokens'
import type {
  IAuditsRepository,
  IAuditResponsesRepository,
} from '../../repositories'
import { AuditValidator } from '../../core/validators'
import { AuditScoringService } from '../../core/services'
import { ChartGeneratorService } from '../services/chart-generator.service'
import { GenerateComplianceReportDto } from '../dtos/generate-compliance-report.dto'
import { ComplianceLevel } from '../../enums/compliance-level.enum'

/**
 * Use Case: Generar Reporte de Cumplimiento de Auditoría
 *
 * Genera un documento DOCX profesional con:
 * - Portada con datos de la auditoría
 * - Resumen ejecutivo con score global y métricas
 * - Gráficas radiales de cumplimiento por área
 * - Gráficas de barras de ponderaciones
 * - Gráfica de dona de niveles de cumplimiento
 * - Tabla detallada de estándares evaluados
 * - Hallazgos y recomendaciones por estándar
 *
 * @example
 * const buffer = await generateComplianceReportUseCase.execute(auditId, options)
 * // Guardar en archivo o enviar al cliente
 */
@Injectable()
export class GenerateComplianceReportUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
    @Inject(AUDIT_RESPONSES_REPOSITORY)
    private readonly responsesRepository: IAuditResponsesRepository,
    private readonly auditValidator: AuditValidator,
    private readonly scoringService: AuditScoringService,
    private readonly chartGenerator: ChartGeneratorService,
    private readonly documentBuilder: SimpleDocumentBuilderService,
  ) {}

  async execute(
    auditId: string,
    options: GenerateComplianceReportDto = {},
  ): Promise<Buffer> {
    // 1. Validar auditoría y obtener datos
    const audit = await this.auditValidator.validateAndGetAudit(auditId)

    // 2. Obtener respuestas con relación standard
    const responses = await this.responsesRepository.findByAudit(auditId)

    // 3. Calcular métricas
    const overallScore = this.scoringService.calculateOverallScore(responses)
    const complianceMetrics =
      this.scoringService.calculateComplianceMetrics(responses)
    const scoreStats = this.scoringService.getScoreStatistics(responses)

    // 4. Generar secciones del documento (TOC se agregará automáticamente)
    const sections: DocumentSection[] = []

    // Portada
    sections.push(this.createCoverSection(audit, overallScore))
    sections.push(createPageBreakSection())

    // Resumen Ejecutivo
    sections.push(
      this.createExecutiveSummary(
        audit,
        overallScore,
        complianceMetrics,
        scoreStats,
      ),
    )
    sections.push(createPageBreakSection())

    // Gráficas
    if (options.includeGaugeChart !== false) {
      const gaugeChart =
        await this.chartGenerator.generateGaugeChart(overallScore)
      sections.push(
        createImageSection(gaugeChart, {
          width: 400,
          height: 300,
          alignment: 'center',
          caption: 'Cumplimiento Global de la Auditoría',
        }),
      )
    }

    if (options.includeComplianceDoughnut !== false) {
      const doughnutChart =
        await this.chartGenerator.generateComplianceDoughnutChart(
          complianceMetrics.compliant,
          complianceMetrics.partial,
          complianceMetrics.nonCompliant,
          complianceMetrics.notApplicable,
        )
      sections.push(
        createImageSection(doughnutChart, {
          width: 500,
          height: 400,
          alignment: 'center',
          caption: 'Distribución de Niveles de Cumplimiento',
        }),
      )
    }

    // Gráfica de Barras Ponderadas
    if (options.includeWeightedBarChart !== false && responses.length > 0) {
      const labels = responses
        .slice(0, 10)
        .map((r) => r.standard?.code || 'N/A')
      const weights = responses
        .slice(0, 10)
        .map((r) => Number(r.weight))
      const scores = responses
        .slice(0, 10)
        .map((r) => (r.score !== null ? Number(r.score) : 0))

      const barChart = await this.chartGenerator.generateWeightedBarChart(
        labels,
        weights,
        scores,
      )

      sections.push(createPageBreakSection())
      sections.push(
        createHeadingSection('Ponderaciones vs Scores Obtenidos', 1),
      )
      sections.push(
        createImageSection(barChart, {
          width: 700,
          height: 500,
          alignment: 'center',
          caption: 'Top 10 Estándares: Ponderación vs Score',
        }),
      )
    }

    // Gráfica Radial por área
    if (options.includeRadarChart !== false && responses.length > 0) {
      const radarData = this.prepareRadarChartData(responses)
      console.log(
        `📊 Radar Chart - Áreas encontradas: ${radarData.labels.length}`,
      )
      console.log(`   Labels: ${radarData.labels.join(', ')}`)
      console.log(`   Scores: ${radarData.scores.join(', ')}`)

      // Generar si hay al menos 2 áreas (antes era > 2, ahora >= 2)
      if (radarData.labels.length >= 2) {
        const radarChart = await this.chartGenerator.generateRadarChart(
          radarData.labels,
          radarData.scores,
        )
        sections.push(createPageBreakSection())
        sections.push(createHeadingSection('Análisis por Área', 1))
        sections.push(
          createImageSection(radarChart, {
            width: 600,
            height: 400,
            alignment: 'center',
            caption: 'Cumplimiento por Área Evaluada',
          }),
        )
      } else {
        console.log(`   ⚠️  No se genera radar chart (mínimo 2 áreas requeridas)`)
      }
    }

    // Tabla Detallada
    if (options.includeDetailedTable !== false) {
      sections.push(createPageBreakSection())
      sections.push(createHeadingSection('Detalle de Estándares Evaluados', 1))
      sections.push(this.createDetailedTable(responses))
    }

    // Sección Detallada por Estándar (con descripción y tabla esperado vs obtenido)
    if (responses.length > 0) {
      sections.push(createPageBreakSection())
      sections.push(
        createHeadingSection('Evaluación Detallada por Estándar', 1, {
          includeInTOC: true,
        }),
      )

      for (const response of responses) {
        sections.push(
          ...this.createStandardDetailSection(response, options),
        )
      }
    }

    // Hallazgos y Recomendaciones (Resumen Global)
    if (options.includeFindingsAndRecommendations !== false) {
      const findingsSection = this.createFindingsSection(responses)
      if (findingsSection) {
        sections.push(createPageBreakSection())
        sections.push(findingsSection)
      }
    }

    // 5. Crear header y footer
    const header = createHeaderFooter([
      createTextContent(audit.name, {
        bold: true,
        fontSize: 10,
      }),
      createTextContent(`Código: ${audit.code}`, {
        fontSize: 9,
        color: '666666',
      }),
    ])

    const footer = createHeaderFooter([
      createTextContent('Reporte de Cumplimiento', {
        fontSize: 8,
        color: '666666',
      }),
      createTextContent('Página ', { fontSize: 9 }),
      createPageNumberContent({ fontSize: 9 }),
    ])

    // 6. Generar documento con TOC
    const docBuffer = await this.documentBuilder.buildDocument({
      theme: MODERN_THEME,
      title: `Reporte de Cumplimiento - ${audit.name}`,
      sections,
      header,
      footer,
      tableOfContents: {
        enabled: true,
        title: 'Índice de Contenido',
        includePageNumbers: true,
        maxLevel: 2,
        insertAtBeginning: true,
      },
    })

    return docBuffer
  }

  /**
   * Crea la sección de portada
   */
  private createCoverSection(
    audit: any,
    overallScore: number,
  ): DocumentSection {
    return createHeadingSection(
      `REPORTE DE CUMPLIMIENTO\n\n${audit.name}\n\n${audit.code}\n\nScore Global: ${overallScore.toFixed(2)}%`,
      1,
    )
  }

  /**
   * Crea el resumen ejecutivo
   */
  private createExecutiveSummary(
    audit: any,
    overallScore: number,
    metrics: any,
    stats: any,
  ): DocumentSection {
    return {
      type: 'html',
      content: {
        html: `
          <h1>Resumen Ejecutivo</h1>
          <p><strong>Organización:</strong> ${audit.organization?.name || 'N/A'}</p>
          <p><strong>Template:</strong> ${audit.template?.name || 'N/A'}</p>
          <p><strong>Framework:</strong> ${audit.framework?.name || 'Sin framework'}</p>
          <p><strong>Estado:</strong> ${audit.status}</p>
          <p><strong>Fecha de cierre:</strong> ${audit.closedAt ? new Date(audit.closedAt).toLocaleDateString() : 'En progreso'}</p>
          <hr />
          <h2>Métricas de Cumplimiento</h2>
          <ul>
            <li><strong>Score Global:</strong> ${overallScore.toFixed(2)}%</li>
            <li><strong>Nivel de Madurez:</strong> ${audit.maturityLevel || 'N/A'}</li>
            <li><strong>Estándares Evaluados:</strong> ${metrics.total}</li>
            <li><strong>Cumplimiento Total:</strong> ${metrics.compliant} (${metrics.compliantPercent.toFixed(1)}%)</li>
            <li><strong>Cumplimiento Parcial:</strong> ${metrics.partial} (${metrics.partialPercent.toFixed(1)}%)</li>
            <li><strong>Sin Cumplimiento:</strong> ${metrics.nonCompliant} (${metrics.nonCompliantPercent.toFixed(1)}%)</li>
            <li><strong>No Aplicable:</strong> ${metrics.notApplicable} (${metrics.notApplicablePercent.toFixed(1)}%)</li>
          </ul>
          ${
            stats
              ? `
          <h2>Estadísticas de Scores</h2>
          <ul>
            <li><strong>Score Mínimo:</strong> ${stats.min.toFixed(2)}%</li>
            <li><strong>Score Máximo:</strong> ${stats.max.toFixed(2)}%</li>
            <li><strong>Score Promedio:</strong> ${stats.average.toFixed(2)}%</li>
          </ul>
          `
              : ''
          }
        `,
      },
    }
  }

  /**
   * Prepara datos para gráfica radial
   */
  private prepareRadarChartData(responses: any[]): {
    labels: string[]
    scores: number[]
  } {
    // Agrupar por los primeros 2 niveles del código (ej: A.5, A.6, A.7, etc.)
    const grouped = responses.reduce((acc, response) => {
      if (!response.standard) return acc

      const code = response.standard.code
      const parts = code.split('.')

      // Tomar los primeros 2 niveles: "A.5.1" → "A.5", "10.1.2" → "10.1"
      const mainCode = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : parts[0]

      if (!acc[mainCode]) {
        acc[mainCode] = {
          scores: [],
          title: response.standard.title,
        }
      }

      if (response.score !== null) {
        acc[mainCode].scores.push(Number(response.score))
      }

      return acc
    }, {})

    const labels: string[] = []
    const scores: number[] = []

    Object.keys(grouped)
      .sort() // Ordenar alfabéticamente (A.5, A.6, A.7, etc.)
      .forEach((mainCode) => {
        const area = grouped[mainCode]
        const avgScore =
          area.scores.reduce((sum: number, s: number) => sum + s, 0) /
          area.scores.length

        // Truncar título para que no sea muy largo
        const shortTitle =
          area.title.length > 25
            ? `${area.title.substring(0, 25)}...`
            : area.title

        labels.push(`${mainCode} - ${shortTitle}`)
        scores.push(Number(avgScore.toFixed(2)))
      })

    return { labels, scores }
  }

  /**
   * Crea tabla detallada de estándares
   */
  private createDetailedTable(responses: any[]): DocumentSection {
    const rows = responses.map((response) => [
      response.standard?.code || 'N/A',
      response.standard?.title || 'N/A',
      `${Number(response.weight).toFixed(2)}%`,
      response.score !== null
        ? `${Number(response.score).toFixed(2)}%`
        : 'Sin evaluar',
      response.complianceLevel || 'N/A',
      response.status,
    ])

    // Anchos optimizados para usar todo el ancho de página (~9500 twips)
    // Código (10%) | Título (35%) | Ponderación (13%) | Score (13%) | Cumplimiento (15%) | Estado (14%)
    return createTableSection(
      ['Código', 'Título', 'Ponderación', 'Score', 'Cumplimiento', 'Estado'],
      rows,
      {
        columnWidths: [950, 3300, 1250, 1250, 1400, 1350],
      },
    )
  }

  /**
   * Crea sección detallada para un estándar individual
   */
  private createStandardDetailSection(
    response: any,
    options: any,
  ): DocumentSection[] {
    const sections: DocumentSection[] = []
    const standard = response.standard

    if (!standard) return sections

    // 1. Título del estándar (nivel 2 para TOC)
    sections.push(
      createHeadingSection(`${standard.code} - ${standard.title}`, 2, {
        includeInTOC: true,
      }),
    )

    // 2. Descripción del estándar
    if (standard.description) {
      sections.push(
        createParagraphSection(standard.description, {
          alignment: 'justify',
        }),
      )
    }

    // 3. Tabla: Esperado vs Obtenido
    const complianceLabel = this.getComplianceLevelLabel(
      response.complianceLevel,
    )
    const scoreValue = response.score !== null ? Number(response.score) : 0

    sections.push(
      createTableSection(
        ['Aspecto', 'Esperado', 'Obtenido'],
        [
          ['Ponderación', '100%', `${Number(response.weight).toFixed(2)}%`],
          ['Score Mínimo', '80%', `${scoreValue.toFixed(2)}%`],
          ['Nivel de Cumplimiento', 'COMPLIANT', complianceLabel],
          ['Estado de Evaluación', 'REVIEWED', response.status],
        ],
        {
          // Anchos optimizados para usar todo el ancho de página (~9500 twips)
          // Aspecto (34%) | Esperado (33%) | Obtenido (33%)
          columnWidths: [3200, 3150, 3150],
        },
      ),
    )

    // 4. Hallazgos (si existen)
    if (response.findings) {
      sections.push(
        createParagraphSection('', { alignment: 'left' }), // Espaciado
      )
      sections.push(
        createParagraphSection(`📋 Hallazgos: ${response.findings}`, {
          alignment: 'justify',
        }),
      )
    }

    // 5. Recomendaciones (si existen)
    if (response.recommendations) {
      sections.push(
        createParagraphSection('', { alignment: 'left' }), // Espaciado
      )
      sections.push(
        createParagraphSection(
          `💡 Recomendaciones: ${response.recommendations}`,
          {
            alignment: 'justify',
          },
        ),
      )
    }

    // 6. Separador entre estándares
    sections.push(createParagraphSection('', { alignment: 'left' }))

    return sections
  }

  /**
   * Obtiene la etiqueta legible del nivel de cumplimiento
   */
  private getComplianceLevelLabel(level: string | null): string {
    const labels: Record<string, string> = {
      COMPLIANT: 'Cumplimiento Total',
      PARTIAL: 'Cumplimiento Parcial',
      NON_COMPLIANT: 'Sin Cumplimiento',
      NOT_APPLICABLE: 'No Aplicable',
    }
    return level ? labels[level] || level : 'Sin Evaluar'
  }

  /**
   * Crea sección de hallazgos y recomendaciones
   */
  private createFindingsSection(responses: any[]): DocumentSection | null {
    const responsesWithFindings = responses.filter(
      (r) => r.findings || r.recommendations,
    )

    if (responsesWithFindings.length === 0) {
      return null
    }

    let html = '<h1>Hallazgos y Recomendaciones</h1>'

    responsesWithFindings.forEach((response) => {
      html += `
        <h2>${response.standard?.code || 'N/A'} - ${response.standard?.title || 'N/A'}</h2>
        ${
          response.findings
            ? `<p><strong>Hallazgos:</strong><br />${response.findings}</p>`
            : ''
        }
        ${
          response.recommendations
            ? `<p><strong>Recomendaciones:</strong><br />${response.recommendations}</p>`
            : ''
        }
        <hr />
      `
    })

    return {
      type: 'html',
      content: {
        html,
      },
    }
  }
}

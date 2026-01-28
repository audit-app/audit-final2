/* import { Injectable, Logger } from '@nestjs/common'
import { Document, Packer, Paragraph, ImageRun, HeadingLevel } from 'docx'
import * as echarts from 'echarts'
import { createCanvas } from 'canvas'
import { RADAR } from '../common/mock-data/radar.mock'
import { ChartOptions } from './interfaces/chart-options.interface'

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name)
  private platformConfigured = false

  constructor() {
    this.configurePlatform()
  }

  private configurePlatform(): void {
    if (!this.platformConfigured) {
      echarts.setPlatformAPI({
        createCanvas: (width, height) => {
          return createCanvas(width || 800, height || 600)
        },

        loadImage: (src, onload, onerror) => {
          const img = new Image()
          img.onload = () => onload(img)
          img.onerror = onerror || (() => {})
          img.src = src
        },

        measureText: (text, font) => {
          const canvas = createCanvas(1, 1)
          const ctx = canvas.getContext('2d')
          ctx.font = font || '12px Arial'
          return ctx.measureText(text)
        },
      })

      this.platformConfigured = true
      this.logger.log('✅ ECharts Platform API configurada correctamente')
    }
  }

  private generateChart(
    chartOptions: ChartOptions,
    width = 800,
    height = 600,
  ): Buffer {
    try {
      this.configurePlatform()

      const canvas = createCanvas(width, height)
      const ctx = canvas.getContext('2d')

      // Configurar contexto para mejor calidad
      ctx.textBaseline = 'alphabetic'
      ctx.patternQuality = 'best'
      ctx.quality = 'best'
      ctx.antialias = 'subpixel'

      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: 2,
      })

      chart.setOption(chartOptions)
      chart.getZr().refresh()

      const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 6,
        filters: canvas.PNG_FILTER_NONE,
        palette: undefined,
        backgroundIndex: 0,
        resolution: undefined,
      })

      chart.dispose()
      return buffer
    } catch (error) {
      this.logger.error('Error generando gráfico:', error)
      throw error
    }
  }

  private getRadarChartOptions(): ChartOptions {
    return {
      legend: {
        data: [
          {
            name: 'Nivel de madurez objetivo',
            itemStyle: {
              color: '#508D69',
            },
          },
          {
            name: 'Nivel actual',
            itemStyle: {
              color: '#FA7070',
            },
          },
        ],
      },
      radar: {
        indicator: RADAR.map((elem) => ({
          name: elem.label,
        })),
        radius: 180,
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: RADAR.map((elem) => elem.acceptanceLevel),
              name: 'Nivel de madurez objetivo',
              lineStyle: {
                color: '#508D69',
              },
              label: {
                show: true,
                formatter: function (params) {
                  return params.value
                },
              },
            },
            {
              value: RADAR.map((elem) => elem.score),
              name: 'Nivel actual',
              lineStyle: {
                color: '#FA7070',
              },
              label: {
                show: true,
                formatter: function (params) {
                  return params.value
                },
              },
            },
          ],
        },
      ],
    }
  }

  async generateReport(width = 800, height = 600): Promise<Buffer> {
    try {
      const barChartOptions = this.getRadarChartOptions()
      const barChartBuffer = this.generateChart(barChartOptions, width, height)

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: 'REPORTE DE ANÁLISIS',
                heading: HeadingLevel.TITLE,
                spacing: {
                  after: 400,
                },
              }),
              new Paragraph({
                children: [
                  new ImageRun({
                    data: barChartBuffer,
                    transformation: {
                      width: 600,
                      height: 450,
                    },
                  }),
                ],
                spacing: {
                  after: 400,
                },
              }),
            ],
          },
        ],
      })

      return await Packer.toBuffer(doc)
    } catch (error) {
      this.logger.error('Error generando reporte:', error)
      throw error
    }
  }
}
 */

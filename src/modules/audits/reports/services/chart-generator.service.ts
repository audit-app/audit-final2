import { Injectable } from '@nestjs/common'
import axios from 'axios'

/**
 * Servicio para generar gráficas usando QuickChart API
 *
 * Responsabilidades:
 * - Generar gráficas radiales de cumplimiento
 * - Generar gráficas de barras de ponderaciones
 * - Retornar imágenes en formato Buffer para DOCX
 *
 * API: https://quickchart.io/documentation/
 */
@Injectable()
export class ChartGeneratorService {
  private readonly QUICKCHART_URL = 'https://quickchart.io/chart'

  /**
   * Genera una gráfica radial (radar/spider) de cumplimiento por área
   *
   * @param labels - Nombres de las áreas evaluadas (ej: ["A.5 Políticas", "A.6 Organización"])
   * @param scores - Puntajes obtenidos (0-100)
   * @param maxScore - Puntaje máximo (default: 100)
   * @returns Buffer de la imagen PNG
   */
  async generateRadarChart(
    labels: string[],
    scores: number[],
    maxScore: number = 100,
  ): Promise<Buffer> {
    const config = {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Cumplimiento (%)',
            data: scores,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scale: {
          ticks: {
            beginAtZero: true,
            max: maxScore,
            stepSize: 20,
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: true,
            text: 'Gráfica de Cumplimiento por Área',
            font: {
              size: 16,
            },
          },
        },
      },
    }

    return await this.fetchChart(config, 600, 400)
  }

  /**
   * Genera una gráfica de barras horizontales para ponderaciones
   *
   * @param labels - Nombres de los estándares
   * @param weights - Ponderaciones (0-100)
   * @param scores - Scores obtenidos (0-100)
   * @returns Buffer de la imagen PNG
   */
  async generateWeightedBarChart(
    labels: string[],
    weights: number[],
    scores: number[],
  ): Promise<Buffer> {
    const config = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ponderación (%)',
            data: weights,
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1,
          },
          {
            label: 'Score Obtenido (%)',
            data: scores,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: true,
            text: 'Ponderaciones vs Scores',
            font: {
              size: 16,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    }

    return await this.fetchChart(config, 800, 500)
  }

  /**
   * Genera una gráfica de dona para niveles de cumplimiento
   *
   * @param compliant - Cantidad de estándares en cumplimiento
   * @param partial - Cantidad de estándares en cumplimiento parcial
   * @param nonCompliant - Cantidad de estándares sin cumplimiento
   * @param notApplicable - Cantidad de estándares no aplicables
   * @returns Buffer de la imagen PNG
   */
  async generateComplianceDoughnutChart(
    compliant: number,
    partial: number,
    nonCompliant: number,
    notApplicable: number,
  ): Promise<Buffer> {
    const config = {
      type: 'doughnut',
      data: {
        labels: [
          'Cumplimiento Total',
          'Cumplimiento Parcial',
          'Sin Cumplimiento',
          'No Aplicable',
        ],
        datasets: [
          {
            data: [compliant, partial, nonCompliant, notApplicable],
            backgroundColor: [
              'rgba(75, 192, 192, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(255, 99, 132, 0.8)',
              'rgba(201, 203, 207, 0.8)',
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(255, 205, 86, 1)',
              'rgba(255, 99, 132, 1)',
              'rgba(201, 203, 207, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
          },
          title: {
            display: true,
            text: 'Distribución de Cumplimiento',
            font: {
              size: 16,
            },
          },
        },
      },
    }

    return await this.fetchChart(config, 500, 400)
  }

  /**
   * Genera una gráfica de progreso circular (gauge)
   *
   * @param percentage - Porcentaje de cumplimiento (0-100)
   * @returns Buffer de la imagen PNG
   */
  async generateGaugeChart(percentage: number): Promise<Buffer> {
    const config = {
      type: 'radialGauge',
      data: {
        datasets: [
          {
            data: [percentage],
            backgroundColor: this.getColorByPercentage(percentage),
            borderWidth: 0,
          },
        ],
      },
      options: {
        centerPercentage: 80,
        centerArea: {
          text: `${percentage.toFixed(1)}%`,
          fontSize: 28,
        },
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: 'Cumplimiento Global',
            font: {
              size: 16,
            },
          },
        },
      },
    }

    return await this.fetchChart(config, 400, 300)
  }

  /**
   * Hace la petición a QuickChart API y retorna el buffer de la imagen
   *
   * @param config - Configuración de Chart.js
   * @param width - Ancho de la imagen
   * @param height - Alto de la imagen
   * @returns Buffer de la imagen PNG
   */
  private async fetchChart(
    config: any,
    width: number,
    height: number,
  ): Promise<Buffer> {
    const params = {
      chart: JSON.stringify(config),
      width,
      height,
      backgroundColor: 'white',
      format: 'png',
    }

    try {
      const response = await axios.get(this.QUICKCHART_URL, {
        params,
        responseType: 'arraybuffer',
      })

      return Buffer.from(response.data, 'binary')
    } catch (error) {
      throw new Error(`Error al generar gráfica: ${error.message}`)
    }
  }

  /**
   * Retorna un color basado en el porcentaje de cumplimiento
   *
   * @param percentage - Porcentaje (0-100)
   * @returns Color en formato rgba
   */
  private getColorByPercentage(percentage: number): string {
    if (percentage >= 80) {
      return 'rgba(75, 192, 192, 0.8)' // Verde
    } else if (percentage >= 60) {
      return 'rgba(255, 205, 86, 0.8)' // Amarillo
    } else if (percentage >= 40) {
      return 'rgba(255, 159, 64, 0.8)' // Naranja
    } else {
      return 'rgba(255, 99, 132, 0.8)' // Rojo
    }
  }
}

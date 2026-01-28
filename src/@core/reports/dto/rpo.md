# Instalación de dependencias

```bash
# Crear nuevo proyecto NestJS
npm i -g @nestjs/cli
nest new report-generator-app
cd report-generator-app

# Instalar dependencias necesarias
npm install docx echarts canvas cors
npm install @types/node --save-dev

# Dependencias adicionales de NestJS
npm install @nestjs/platform-express
```

# Estructura de archivos

```
src/
├── app.module.ts
├── main.ts
├── reports/
│   ├── reports.module.ts
│   ├── reports.controller.ts
│   ├── reports.service.ts
│   ├── dto/
│   │   └── generate-report.dto.ts
│   └── interfaces/
│       └── chart-options.interface.ts
├── common/
│   └── mock-data/
│       └── radar.mock.ts
└── config/
    └── cors.config.ts
```

## 1. main.ts

```typescript
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { corsConfig } from './config/cors.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Configurar CORS
  app.enableCors(corsConfig)

  // Configurar límite de payload
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ extended: true, limit: '50mb' }))

  await app.listen(3001)
  console.log(`🚀 Servidor NestJS ejecutándose en http://localhost:3001`)
  console.log('📋 Endpoints disponibles:')
  console.log('  POST /reports/generate - Generar reporte completo')
}
bootstrap()
```

## 2. config/cors.config.ts

```typescript
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface'

export const corsConfig: CorsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)

    const allowedOrigins = ['http://localhost:8080']

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(null, true)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}
```

## 3. common/mock-data/radar.mock.ts

```typescript
export const RADAR = [
  // Aquí va tu mock data del RADAR
  // Ejemplo:
  { label: 'Categoría 1', acceptanceLevel: 5, score: 3 },
  { label: 'Categoría 2', acceptanceLevel: 4, score: 2 },
  { label: 'Categoría 3', acceptanceLevel: 5, score: 4 },
  // ... más datos
]
```

## 4. reports/interfaces/chart-options.interface.ts

```typescript
export interface RadarIndicator {
  name: string
}

export interface RadarSeries {
  type: string
  data: RadarData[]
}

export interface RadarData {
  value: number[]
  name: string
  lineStyle: {
    color: string
  }
  label: {
    show: boolean
    formatter: Function
  }
}

export interface ChartOptions {
  legend?: any
  radar?: {
    indicator: RadarIndicator[]
    radius: number
  }
  series: RadarSeries[]
}

export interface RadarItem {
  label: string
  acceptanceLevel: number
  score: number
}
```

## 5. reports/dto/generate-report.dto.ts

```typescript
import { IsOptional, IsNumber, Min, Max } from 'class-validator'

export class GenerateReportDto {
  @IsOptional()
  @IsNumber()
  @Min(400)
  @Max(1200)
  width?: number = 800

  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(800)
  height?: number = 600
}
```

## 6. reports/reports.service.ts

```typescript
import { Injectable, Logger } from '@nestjs/common'
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
```

## 7. reports/reports.controller.ts

```typescript
import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Logger,
  Header,
} from '@nestjs/common'
import { Response } from 'express'
import { ReportsService } from './reports.service'
import { GenerateReportDto } from './dto/generate-report.dto'

@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name)

  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  @Header('Access-Control-Allow-Headers', 'Content-Type')
  async generateReport(
    @Body() generateReportDto: GenerateReportDto,
    @Res() res: Response,
  ) {
    try {
      const { width, height } = generateReportDto

      this.logger.log(`Generando reporte con dimensiones: ${width}x${height}`)

      const buffer = await this.reportsService.generateReport(width, height)

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="reporte-con-graficos.docx"',
      )
      res.setHeader('Content-Length', buffer.length)

      res.status(HttpStatus.OK).send(buffer)
    } catch (error) {
      this.logger.error('Error generando reporte:', error)
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error generando el reporte',
        message: error.message,
      })
    }
  }
}
```

## 8. reports/reports.module.ts

```typescript
import { Module } from '@nestjs/common'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
```

## 9. app.module.ts

```typescript
import { Module } from '@nestjs/common'
import { ReportsModule } from './reports/reports.module'

@Module({
  imports: [ReportsModule],
})
export class AppModule {}
```

# Comandos para ejecutar

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Testing
npm run test
```

# Uso del endpoint

```bash
# Generar reporte básico
curl -X POST http://localhost:3001/reports/generate \
  -H "Content-Type: application/json" \
  -d '{}' \
  --output reporte.docx

# Generar reporte con dimensiones personalizadas
curl -X POST http://localhost:3001/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"width": 1000, "height": 700}' \
  --output reporte-custom.docx
```

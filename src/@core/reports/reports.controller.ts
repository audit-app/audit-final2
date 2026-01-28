import {
  Body,
  Controller,
  Post,
  Res,
  InternalServerErrorException,
  UsePipes,
  ValidationPipe,
  Logger,
} from '@nestjs/common'
import type { Response } from 'express'
import { ReportsService } from './services/reports.service'
import { UserStyleOverridesDto } from './dto/report-config.dto'
import { Public } from 'src/modules/auth/core'

@Public()
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name)

  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async generateDocument(
    @Res() res: Response,
    @Body() dto?: UserStyleOverridesDto,
  ) {
    try {
      this.logger.log('Generando documento DOCX...')

      const buffer =
        await this.reportsService.generateFullDocumentWithOptions(dto)

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="reporte.docx"',
        'Content-Length': buffer.length,
      })

      res.end(buffer)

      this.logger.log('Documento generado exitosamente')
    } catch (error) {
      this.logger.error('Error generando documento:', error)
      throw new InternalServerErrorException(
        'Error al generar el documento. Por favor, intente nuevamente.',
      )
    }
  }
}

import { Body, Controller, Get, Post, Res } from '@nestjs/common'
import { Response } from 'express'
import { DocumentExampleService } from './services/exampl.service'

@Controller('document-example')
export class DocumentExampleController {
  constructor(private readonly documentService: DocumentExampleService) {}

  @Post()
  async getExampleDocument(
    @Res() res: Response,
    // @Body() dto: UserStyleOverridesDto,
  ) {
    const buffer = await this.documentService.generateFullDocumentWithOptions()

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="ejemplo.docx"',
      'Content-Length': buffer.length,
    })

    res.end(buffer)
  }
}

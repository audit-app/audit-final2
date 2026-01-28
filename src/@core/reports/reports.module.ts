import { Module } from '@nestjs/common'
import { DocumentExampleController } from './reports.controller'
import { DocumentExampleService } from './services/exampl.service'

import { ThemeManagerService } from './services/theme.service'
import { SimpleDocumentBuilderService } from './services/component.service'
import { HtmlToSectionsConverterService } from './services/html-docx.service'

@Module({
  controllers: [DocumentExampleController],
  providers: [
    DocumentExampleService,
    HtmlToSectionsConverterService,
    ThemeManagerService,
    SimpleDocumentBuilderService,
  ],
  exports: [],
})
export class ReportsModule {}

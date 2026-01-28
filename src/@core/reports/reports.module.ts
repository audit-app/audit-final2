import { Module } from '@nestjs/common'
import { ReportsController } from './reports.controller'
import { ReportsService } from './services/reports.service'

import { ThemeManagerService } from './services/theme.service'
import { SimpleDocumentBuilderService } from './services/component.service'
import { HtmlToSectionsConverterService } from './services/html-docx.service'

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    HtmlToSectionsConverterService,
    ThemeManagerService,
    SimpleDocumentBuilderService,
  ],
  exports: [
    ReportsService,
    ThemeManagerService,
    SimpleDocumentBuilderService,
    HtmlToSectionsConverterService,
  ],
})
export class ReportsModule {}

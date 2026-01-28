import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReportsController } from './reports.controller'
import { ReportsService } from './services/reports.service'

import { ThemeManagerService } from './services/theme.service'
import { SimpleDocumentBuilderService } from './services/component.service'
import { HtmlToSectionsConverterService } from './services/html-docx.service'

// Importamos las entidades para poder acceder a los repositorios
import { TemplateEntity } from '../../modules/audit-library/templates/entities/template.entity'
import { StandardEntity } from '../../modules/audit-library/standards/entities/standard.entity'

@Module({
  imports: [TypeOrmModule.forFeature([TemplateEntity, StandardEntity])],
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

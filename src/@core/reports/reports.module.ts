import { Module } from '@nestjs/common'
import { ThemeManagerService } from './services/theme.service'
import { SimpleDocumentBuilderService } from './services/component.service'
import { HtmlToSectionsConverterService } from './services/html-docx.service'

/**
 * ReportsModule - Sistema de generación de reportes DOCX
 *
 * Módulo de infraestructura para generar documentos Word (.docx) profesionales
 * con soporte para HTML, tablas, listas, estilos personalizados y temas.
 *
 * IMPORTANTE: Este módulo NO incluye controllers ni servicios de ejemplo.
 * Es infraestructura pura y reutilizable.
 *
 * Los módulos de negocio deben:
 * 1. Importar este módulo
 * 2. Inyectar los servicios necesarios
 * 3. Crear sus propios controllers
 *
 * Servicios disponibles:
 * - SimpleDocumentBuilderService: Constructor de documentos DOCX
 * - ThemeManagerService: Gestión de temas y estilos
 * - HtmlToSectionsConverterService: Conversión de HTML a DOCX
 *
 * Ver: REPORTS_USAGE.md para ejemplos de uso
 * Test: npm run reports:test (genera ejemplo en uploads/reports/)
 */
@Module({
  providers: [
    HtmlToSectionsConverterService,
    ThemeManagerService,
    SimpleDocumentBuilderService,
  ],
  exports: [
    ThemeManagerService,
    SimpleDocumentBuilderService,
    HtmlToSectionsConverterService,
  ],
})
export class ReportsModule {}

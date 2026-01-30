/**
 * @core/reports - Sistema de generación de reportes DOCX
 *
 * Módulo de infraestructura para generar documentos Word (.docx) profesionales.
 *
 * Exports principales:
 * - ReportsModule: Módulo NestJS a importar
 * - Servicios: SimpleDocumentBuilderService, ThemeManagerService, HtmlToSectionsConverterService
 * - Interfaces: Todas las interfaces necesarias para crear documentos
 * - Helpers: Funciones helper para crear secciones fácilmente
 * - Temas: MODERN_THEME y otros temas predefinidos
 *
 * Ver: REPORTS_USAGE.md para documentación completa
 * Test: npm run reports:test
 */

// Módulo principal
export * from './reports.module'

// Servicios
export * from './services/component.service'
export * from './services/theme.service'
export * from './services/html-docx.service'

// Interfaces y types
export * from './interfaces'

// Temas
export * from './theme'

// DTOs
export * from './dto/report-config.dto'

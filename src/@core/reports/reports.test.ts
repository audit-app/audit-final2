/**
 * Reports Module - Test & Development Tool
 *
 * Script para probar el sistema de generación de reportes DOCX.
 * Genera un archivo de ejemplo con todas las capacidades del sistema.
 *
 * Características probadas:
 * - Headings (6 niveles)
 * - Paragraphs (simple y con estilos inline)
 * - Tables (con headers y estilos)
 * - Lists (bullets, numeradas, anidadas)
 * - Images (con captions)
 * - Table of Contents
 * - Headers y Footers
 * - Page breaks y spacers
 *
 * Uso:
 *   npm run reports:test               # Generar reporte de ejemplo
 *   npm run reports:test help          # Mostrar ayuda
 */

/* eslint-disable @typescript-eslint/ban-ts-comment */

/* eslint-disable @typescript-eslint/no-floating-promises */
// @ts-nocheck - Suppress type errors in test file
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../../app.module'
import { SimpleDocumentBuilderService } from './services/component.service'
import {
  DocumentSection,
  createHeadingSection,
  createParagraphSection,
  createTableSection,
  createBulletList,
  createNumberedList,
  createListSection,
  createImageSection,
  createTableOfContentsSection,
  createHeaderFooter,
  createTextContent,
  createPageNumberContent,
  createDateContent,
  createStyledParagraph,
  bold,
  italic,
  colored,
  highlighted,
} from './interfaces'
import { MODERN_THEME } from './theme'
import * as fs from 'fs'
import * as path from 'path'
import chalk from 'chalk'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Muestra ayuda del script
 */
function showHelp() {
  console.log(chalk.cyan('━'.repeat(70)))
  console.log(chalk.bold.cyan('📊 Reports Testing Tool'))
  console.log(chalk.cyan('━'.repeat(70)))
  console.log('')
  console.log(chalk.yellow('Uso:'))
  console.log(
    chalk.white(
      '  npm run reports:test               # Generar reporte completo',
    ),
  )
  console.log(
    chalk.white('  npm run reports:test help          # Mostrar esta ayuda'),
  )
  console.log('')
  console.log(chalk.yellow('Salida:'))
  console.log(chalk.white('  uploads/reports/example-report.docx'))
  console.log('')
  console.log(chalk.yellow('Características probadas:'))
  console.log(chalk.white('  ✓ Headings (6 niveles)'))
  console.log(chalk.white('  ✓ Paragraphs (simple y con estilos inline)'))
  console.log(chalk.white('  ✓ Tables (con headers y estilos)'))
  console.log(chalk.white('  ✓ Lists (bullets, numeradas, anidadas)'))
  console.log(chalk.white('  ✓ Images (con captions)'))
  console.log(chalk.white('  ✓ Table of Contents'))
  console.log(chalk.white('  ✓ Headers y Footers'))
  console.log(chalk.white('  ✓ Page breaks y spacers'))
  console.log(chalk.cyan('━'.repeat(70)))
  console.log('')
}

/**
 * Asegura que el directorio de uploads existe
 */
function ensureUploadDirectory(): string {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'reports')

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
    console.log(chalk.green('✓ Directorio creado:'), chalk.white(uploadsDir))
  }

  return uploadsDir
}

/**
 * Genera una imagen PNG tiny para pruebas
 */
function generateTinyPng(): Buffer {
  const tinyPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
  return Buffer.from(tinyPngBase64, 'base64')
}

// ============================================================================
// DOCUMENT GENERATION
// ============================================================================

/**
 * Genera un reporte de ejemplo completo
 */
async function generateExampleReport(
  builder: SimpleDocumentBuilderService,
): Promise<Buffer> {
  const sections: DocumentSection[] = []
  const tinyPngBuffer = generateTinyPng()

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📌 PORTADA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sections.push(
    { type: 'nextPageBreak' },
    createHeadingSection('Reporte de Ejemplo - Sistema de Reportes ATR', 1),
    createStyledParagraph([
      bold('Generado por: '),
      'ATR - Audit Template Repository',
    ]),
    createStyledParagraph([
      bold('Fecha: '),
      new Date().toLocaleDateString('es-ES'),
    ]),
    createParagraphSection(
      'Este documento muestra ejemplos de todas las capacidades del sistema de generación de reportes.',
    ),
    { type: 'nextPageBreak' },
  )

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📌 TABLA DE CONTENIDOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sections.push(
    createHeadingSection('Tabla de Contenidos', 1, { includeInTOC: false }),
    createTableOfContentsSection({
      maxLevel: 3,
      includePageNumbers: true,
    }),
    { type: 'nextPageBreak' },
  )

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📌 1. HEADINGS Y PÁRRAFOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sections.push(
    createHeadingSection('1. Headings y Párrafos', 1),
    createParagraphSection(
      'Esta sección muestra los diferentes niveles de headings y estilos de párrafos.',
    ),
    { type: 'spacer', content: { height: 200 } },

    createHeadingSection('1.1 Nivel 2', 2),
    createParagraphSection(
      'Este es un párrafo simple bajo un heading nivel 2.',
    ),

    createHeadingSection('1.1.1 Nivel 3', 3),
    createParagraphSection(
      'Este es un párrafo simple bajo un heading nivel 3.',
    ),

    createHeadingSection('1.2 Estilos Inline', 2),
    createStyledParagraph([
      'Este párrafo tiene ',
      bold('texto en negrita'),
      ', ',
      italic('texto en cursiva'),
      ', ',
      colored('texto en rojo', 'FF0000'),
      ' y ',
      highlighted('texto resaltado', 'FFFF00'),
      '.',
    ]),
    { type: 'nextPageBreak' },
  )

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📌 2. TABLAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sections.push(
    createHeadingSection('2. Tablas', 1),
    createParagraphSection(
      'Las tablas permiten organizar datos de manera estructurada.',
    ),
    { type: 'spacer', content: { height: 200 } },

    createHeadingSection('2.1 Tabla de Ejemplo - Templates', 2),
    createTableSection(
      ['Código', 'Nombre', 'Versión', 'Estado'],
      [
        ['ISO-27001-2022', 'ISO 27001:2022', '2022.1', 'PUBLISHED'],
        ['COBIT-2019', 'COBIT 2019', '2019.2', 'PUBLISHED'],
        ['NIST-CSF-1.1', 'NIST CSF v1.1', '1.1.0', 'PUBLISHED'],
      ],
      { columnWidths: [20, 40, 20, 20] },
    ),
    { type: 'spacer', content: { height: 200 } },

    createHeadingSection('2.2 Tabla de Propiedades', 2),
    createTableSection(
      ['Propiedad', 'Valor'],
      [
        ['Código', 'ISO-27001-2022'],
        ['Nombre', 'ISO/IEC 27001:2022'],
        ['Versión', '2022.1'],
        ['Estado', 'PUBLISHED'],
        ['Total de Standards', '114'],
        ['Controles Auditables', '93'],
      ],
      { columnWidths: [40, 60] },
    ),
    { type: 'nextPageBreak' },
  )

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📌 3. LISTAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sections.push(
    createHeadingSection('3. Listas', 1),
    createParagraphSection(
      'El sistema soporta diferentes tipos de listas: bullets, numeradas y anidadas.',
    ),
    { type: 'spacer', content: { height: 200 } },

    createHeadingSection('3.1 Lista con Bullets', 2),
    createBulletList([
      'Primer item',
      'Segundo item',
      'Tercer item',
      'Cuarto item',
    ]),
    { type: 'spacer', content: { height: 200 } },

    createHeadingSection('3.2 Lista Numerada', 2),
    createNumberedList(
      [
        'Paso 1: Configurar el proyecto',
        'Paso 2: Importar el módulo',
        'Paso 3: Usar los servicios',
        'Paso 4: Generar el reporte',
      ],
      'decimal',
    ),
    { type: 'spacer', content: { height: 200 } },

    createHeadingSection('3.3 Lista Anidada', 2),
    createListSection(
      [
        {
          text: 'Frameworks de Auditoría',
          subItems: [
            'ISO 27001:2022 - Seguridad de la Información',
            'COBIT 2019 - Gobierno de TI',
            'NIST CSF - Cybersecurity Framework',
          ],
        },
        {
          text: 'Frameworks de Madurez',
          subItems: ['COBIT 5 - 6 niveles', 'CMMI - 5 niveles'],
        },
        'Otros Estándares',
      ],
      'bullet',
    ),
    { type: 'nextPageBreak' },
  )

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📌 4. IMÁGENES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sections.push(
    createHeadingSection('4. Imágenes', 1),
    createParagraphSection(
      'Las imágenes pueden incluirse con captions y diferentes alineaciones.',
    ),
    { type: 'spacer', content: { height: 200 } },

    createImageSection(tinyPngBuffer, {
      width: 400,
      height: 300,
      caption: 'Figura 1: Imagen de ejemplo',
      captionPosition: 'below',
      alignment: 'center',
    }),
    { type: 'nextPageBreak' },
  )

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📌 5. ESTADÍSTICAS DE EJEMPLO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sections.push(
    createHeadingSection('5. Estadísticas del Sistema', 1),
    createParagraphSection(
      'Resumen de datos de ejemplo del sistema de auditoría.',
    ),
    { type: 'spacer', content: { height: 200 } },

    createHeadingSection('5.1 Resumen General', 2),
    createTableSection(
      ['Métrica', 'Cantidad', 'Estado'],
      [
        ['Templates Totales', '5', 'Activo'],
        ['Standards Totales', '342', 'Activo'],
        ['Controles Auditables', '298', 'Activo'],
        ['Frameworks de Madurez', '2', 'Activo'],
        ['Niveles de Madurez', '11', 'Activo'],
      ],
      { columnWidths: [50, 25, 25] },
    ),
    { type: 'spacer', content: { height: 200 } },

    createHeadingSection('5.2 Distribución por Framework', 2),
    createTableSection(
      ['Framework', 'Standards', 'Controles', 'Porcentaje'],
      [
        ['ISO 27001:2022', '114', '93', '33.3%'],
        ['COBIT 2019', '40', '40', '11.7%'],
        ['NIST CSF', '108', '98', '31.6%'],
        ['SOC 2', '80', '67', '23.4%'],
      ],
      { columnWidths: [40, 20, 20, 20] },
    ),
    { type: 'nextPageBreak' },
  )

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📌 6. CONCLUSIONES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sections.push(
    createHeadingSection('6. Conclusiones', 1),
    createParagraphSection(
      'Este documento de ejemplo demuestra las capacidades del sistema de generación de reportes:',
    ),
    { type: 'spacer', content: { height: 200 } },

    createBulletList([
      'Soporte completo para headings de 6 niveles',
      'Párrafos con estilos inline (bold, italic, colored, etc.)',
      'Tablas profesionales con headers estilizados',
      'Listas (bullets, numeradas, anidadas)',
      'Imágenes con captions y alineaciones',
      'Tabla de contenidos automática',
      'Headers y footers personalizables',
      'Page breaks y espaciadores',
    ]),
    { type: 'spacer', content: { height: 200 } },

    createParagraphSection(
      'El sistema está listo para ser usado en módulos de negocio. Ver REPORTS_USAGE.md para documentación completa.',
    ),
  )

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📌 CONFIGURAR HEADERS Y FOOTERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const header = createHeaderFooter(
    [createTextContent('ATR - Audit Template Repository'), createDateContent()],
    {
      columnWidths: [70, 30],
      alignment: ['left', 'right'],
      showBorder: true,
    },
  )

  const footer = createHeaderFooter(
    [
      createTextContent('© 2024 ATR - Reporte de Ejemplo'),
      createPageNumberContent(),
    ],
    {
      columnWidths: [70, 30],
      alignment: ['left', 'right'],
    },
  )

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📌 GENERAR DOCUMENTO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return await builder.buildDocument({
    theme: MODERN_THEME,
    title: 'Reporte de Ejemplo - Sistema de Reportes ATR',
    sections,
    header,
    footer,
  })
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'generate'

  // Mostrar ayuda
  if (command === 'help') {
    showHelp()
    process.exit(0)
  }

  console.log(chalk.cyan('━'.repeat(70)))
  console.log(chalk.bold.cyan('📊 Reports Testing Tool'))
  console.log(chalk.cyan('━'.repeat(70)))
  console.log('')

  try {
    // Inicializar NestJS app
    console.log(chalk.yellow('🔄 Inicializando aplicación...'))
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'],
    })

    const builder = app.get(SimpleDocumentBuilderService)

    // Asegurar directorio de uploads
    const uploadsDir = ensureUploadDirectory()

    // Generar reporte
    console.log(chalk.yellow('📝 Generando reporte de ejemplo...'))
    const buffer = await generateExampleReport(builder)

    // Guardar archivo
    const filePath = path.join(uploadsDir, 'example-report.docx')
    fs.writeFileSync(filePath, buffer)

    console.log('')
    console.log(chalk.green('✓ Reporte generado exitosamente'))
    console.log(chalk.white('  Ubicación:'), chalk.cyan(filePath))
    console.log(
      chalk.white('  Tamaño:'),
      chalk.cyan(`${(buffer.length / 1024).toFixed(2)} KB`),
    )
    console.log('')
    console.log(chalk.yellow('📖 Para más información:'))
    console.log(chalk.white('  Ver: src/@core/reports/REPORTS_USAGE.md'))
    console.log(chalk.cyan('━'.repeat(70)))

    await app.close()
    process.exit(0)
  } catch (error) {
    console.error(chalk.red('✗ Error al generar reporte:'))
    console.error(chalk.red(error instanceof Error ? error.message : error))
    if (error instanceof Error && error.stack) {
      console.error(chalk.gray(error.stack))
    }
    console.log(chalk.cyan('━'.repeat(70)))
    process.exit(1)
  }
}

// Ejecutar
main()

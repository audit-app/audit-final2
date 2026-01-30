# Sistema de Generación de Reportes DOCX

Sistema de infraestructura para generar documentos Word (.docx) profesionales con soporte completo para HTML, tablas, listas, estilos personalizados, temas y más.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Servicios Disponibles](#servicios-disponibles)
- [Instalación en tu Módulo](#instalación-en-tu-módulo)
- [Tipos de Secciones](#tipos-de-secciones)
- [Helpers Disponibles](#helpers-disponibles)
- [Ejemplos Prácticos](#ejemplos-prácticos)
- [Temas Disponibles](#temas-disponibles)
- [Configuración Avanzada](#configuración-avanzada)

---

## Descripción General

El módulo `@core/reports` proporciona infraestructura reutilizable para generar reportes en formato DOCX. Es **agnóstico al dominio** y no incluye controllers, solo servicios que puedes consumir desde tus módulos de negocio.

### Características principales:

✅ Generación de documentos Word (.docx) profesionales
✅ Soporte para HTML (conversión automática a secciones)
✅ Tablas con estilos personalizados
✅ Listas (bullets, numeradas, checklist, custom)
✅ Imágenes con captions
✅ Headers y footers personalizables
✅ Tabla de contenidos automática
✅ Temas predefinidos (Modern, Classic, etc.)
✅ Estilos inline (bold, italic, colored, etc.)
✅ Page breaks y espaciadores
✅ Validación de configuración

---

## Servicios Disponibles

### 1. `ReportsService`

Servicio principal para generar documentos completos.

```typescript
import { ReportsService } from '@core/reports'

@Injectable()
export class MyReportsService {
  constructor(private readonly reportsService: ReportsService) {}

  async generateReport(): Promise<Buffer> {
    // Usar métodos del ReportsService
    return await this.reportsService.generateFullDocumentWithOptions()
  }
}
```

### 2. `SimpleDocumentBuilderService`

Constructor de documentos de bajo nivel.

```typescript
import { SimpleDocumentBuilderService } from '@core/reports'

const docBuffer = await this.builder.buildDocument(config)
```

### 3. `ThemeManagerService`

Gestión de temas y estilos.

```typescript
import { ThemeManagerService } from '@core/reports'

const modernTheme = this.themeManager.getTheme('modern')
const customTheme = this.themeManager.createCustomTheme(overrides)
```

### 4. `HtmlToSectionsConverterService`

Convierte HTML a secciones DOCX.

```typescript
import { HtmlToSectionsConverterService } from '@core/reports'

const sections = await this.htmlConverter.convertHtmlToSections(html)
```

---

## Instalación en tu Módulo

### Paso 1: Importar ReportsModule

```typescript
// src/modules/tu-modulo/tu-modulo.module.ts
import { Module } from '@nestjs/common'
import { ReportsModule } from '@core/reports'
import { TuReportsController } from './controllers/tu-reports.controller'
import { TuReportsService } from './services/tu-reports.service'

@Module({
  imports: [ReportsModule], // ← Importar módulo de reports
  controllers: [TuReportsController],
  providers: [TuReportsService],
})
export class TuModuloModule {}
```

### Paso 2: Crear tu servicio

```typescript
// src/modules/tu-modulo/services/tu-reports.service.ts
import { Injectable } from '@nestjs/common'
import {
  SimpleDocumentBuilderService,
  ThemeManagerService,
  DocumentSection,
  createHeadingSection,
  createParagraphSection,
  createTableSection,
  MODERN_THEME,
} from '@core/reports'

@Injectable()
export class TuReportsService {
  constructor(
    private readonly builder: SimpleDocumentBuilderService,
    private readonly themeManager: ThemeManagerService,
  ) {}

  async generateCustomReport(): Promise<Buffer> {
    const sections: DocumentSection[] = []

    // Portada
    sections.push(
      createHeadingSection('Mi Reporte Custom', 1),
      createParagraphSection('Generado por: Mi Módulo'),
      { type: 'nextPageBreak' },
    )

    // Contenido
    sections.push(
      createHeadingSection('1. Introducción', 1),
      createParagraphSection('Este es el contenido de mi reporte...'),
    )

    // Generar documento
    return await this.builder.buildDocument({
      theme: MODERN_THEME,
      title: 'Mi Reporte Custom',
      sections,
    })
  }
}
```

### Paso 3: Crear tu controller

```typescript
// src/modules/tu-modulo/controllers/tu-reports.controller.ts
import {
  Controller,
  Get,
  Res,
  InternalServerErrorException,
} from '@nestjs/common'
import type { Response } from 'express'
import { TuReportsService } from '../services/tu-reports.service'

@Controller('tu-modulo/reports')
export class TuReportsController {
  constructor(private readonly tuReportsService: TuReportsService) {}

  @Get('generate')
  async generateReport(@Res() res: Response): Promise<void> {
    try {
      const buffer = await this.tuReportsService.generateCustomReport()

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="reporte.docx"',
      )
      res.send(buffer)
    } catch (error) {
      throw new InternalServerErrorException('Error generando reporte')
    }
  }
}
```

---

## Tipos de Secciones

### 1. Heading (Encabezados)

```typescript
import { createHeadingSection } from '@core/reports'

sections.push(
  createHeadingSection('Título Nivel 1', 1),
  createHeadingSection('Título Nivel 2', 2),
  createHeadingSection('Título Nivel 3', 3, {
    includeInTOC: true, // Incluir en tabla de contenidos
    tocText: 'Texto alternativo para TOC',
  }),
)
```

### 2. Paragraph (Párrafos)

**Párrafo simple:**
```typescript
import { createParagraphSection } from '@core/reports'

sections.push(
  createParagraphSection('Este es un párrafo simple.'),
  createParagraphSection('Párrafo centrado', { alignment: 'center' }),
  createParagraphSection('Párrafo justificado', { alignment: 'justify' }),
)
```

**Párrafo con estilos inline:**
```typescript
import { createStyledParagraph, bold, italic, colored } from '@core/reports'

sections.push(
  createStyledParagraph([
    'Texto normal, ',
    bold('texto en negrita'),
    ', ',
    italic('texto en cursiva'),
    ' y ',
    colored('texto en color', 'FF0000'),
  ]),
)
```

### 3. Table (Tablas)

```typescript
import { createTableSection } from '@core/reports'

sections.push(
  createTableSection(
    ['Columna 1', 'Columna 2', 'Columna 3'], // Headers
    [
      ['Fila 1, Col 1', 'Fila 1, Col 2', 'Fila 1, Col 3'],
      ['Fila 2, Col 1', 'Fila 2, Col 2', 'Fila 2, Col 3'],
    ], // Rows
    {
      columnWidths: [30, 40, 30], // Anchos en porcentaje
    },
  ),
)
```

### 4. List (Listas)

**Lista con bullets:**
```typescript
import { createBulletList } from '@core/reports'

sections.push(
  createBulletList([
    'Primer item',
    'Segundo item',
    'Tercer item',
  ]),
)
```

**Lista numerada:**
```typescript
import { createNumberedList } from '@core/reports'

sections.push(
  createNumberedList(['Item 1', 'Item 2', 'Item 3'], 'decimal'),
)
```

**Lista anidada:**
```typescript
import { createListSection } from '@core/reports'

sections.push(
  createListSection(
    [
      {
        text: 'Nivel 1 - Item 1',
        subItems: [
          'Nivel 2 - Item 1.1',
          'Nivel 2 - Item 1.2',
        ],
      },
      'Nivel 1 - Item 2',
    ],
    'bullet',
  ),
)
```

### 5. Image (Imágenes)

```typescript
import { createImageSection } from '@core/reports'
import * as fs from 'fs'

const imageBuffer = fs.readFileSync('path/to/image.png')

sections.push(
  createImageSection(imageBuffer, {
    width: 400,
    height: 300,
    caption: 'Figura 1: Mi imagen',
    captionPosition: 'below',
    alignment: 'center',
  }),
)
```

### 6. Table of Contents (Tabla de Contenidos)

```typescript
import { createTableOfContentsSection } from '@core/reports'

sections.push(
  createTableOfContentsSection({
    title: 'Tabla de Contenidos',
    maxLevel: 3, // Incluir headings hasta nivel 3
    includePageNumbers: true,
  }),
)
```

### 7. Page Breaks

```typescript
sections.push(
  { type: 'pageBreak' }, // Salto de página
  { type: 'nextPageBreak' }, // Salto a siguiente página
)
```

### 8. Spacer (Espaciadores)

```typescript
import { createSpacerSection } from '@core/reports'

sections.push(
  createSpacerSection(400), // Espacio de 400 twips (~0.5 cm)
)
```

---

## Helpers Disponibles

### Texto Estilizado

```typescript
import {
  bold,
  italic,
  underline,
  strikethrough,
  colored,
  highlighted,
  superscript,
  subscript,
  styled,
} from '@core/reports'

// Uso individual
const textoBold = bold('Texto en negrita')
const textoItalic = italic('Texto en cursiva')
const textoColor = colored('Texto rojo', 'FF0000')

// Uso combinado
const textoCombinado = styled('Texto especial', {
  bold: true,
  italic: true,
  color: '0000FF',
  fontSize: 14,
})
```

### Headers y Footers

```typescript
import {
  createHeaderFooter,
  createTextContent,
  createPageNumberContent,
  createDateContent,
  createImageContent,
} from '@core/reports'

// Header con 3 columnas
const header = createHeaderFooter(
  [
    createTextContent('Mi Empresa'),
    createTextContent('Reporte Confidencial'),
    createDateContent(),
  ],
  {
    columnWidths: [33, 34, 33],
    alignment: ['left', 'center', 'right'],
    showBorder: true,
  },
)

// Footer con número de página
const footer = createHeaderFooter(
  [
    createTextContent('© 2024 Mi Empresa'),
    createPageNumberContent(),
  ],
  {
    columnWidths: [70, 30],
    alignment: ['left', 'right'],
  },
)
```

---

## Ejemplos Prácticos

### Ejemplo 1: Reporte Simple

```typescript
import {
  SimpleDocumentBuilderService,
  DocumentSection,
  createHeadingSection,
  createParagraphSection,
  createTableSection,
  MODERN_THEME,
} from '@core/reports'

@Injectable()
export class SimpleReportService {
  constructor(private readonly builder: SimpleDocumentBuilderService) {}

  async generateSimpleReport(): Promise<Buffer> {
    const sections: DocumentSection[] = [
      // Portada
      createHeadingSection('Mi Primer Reporte', 1),
      createParagraphSection('Fecha: ' + new Date().toLocaleDateString()),
      { type: 'nextPageBreak' },

      // Contenido
      createHeadingSection('1. Introducción', 1),
      createParagraphSection('Este es un reporte de ejemplo...'),

      createHeadingSection('2. Datos', 1),
      createTableSection(
        ['ID', 'Nombre', 'Estado'],
        [
          ['1', 'Item A', 'Activo'],
          ['2', 'Item B', 'Inactivo'],
        ],
      ),
    ]

    return await this.builder.buildDocument({
      theme: MODERN_THEME,
      title: 'Mi Primer Reporte',
      sections,
    })
  }
}
```

### Ejemplo 2: Reporte con HTML

```typescript
import {
  HtmlToSectionsConverterService,
  SimpleDocumentBuilderService,
  MODERN_THEME,
} from '@core/reports'

@Injectable()
export class HtmlReportService {
  constructor(
    private readonly htmlConverter: HtmlToSectionsConverterService,
    private readonly builder: SimpleDocumentBuilderService,
  ) {}

  async generateFromHtml(html: string): Promise<Buffer> {
    // Convertir HTML a secciones
    const sections = await this.htmlConverter.convertHtmlToSections(html)

    return await this.builder.buildDocument({
      theme: MODERN_THEME,
      title: 'Reporte desde HTML',
      sections,
    })
  }
}
```

### Ejemplo 3: Reporte con Tema Personalizado

```typescript
import {
  ThemeManagerService,
  SimpleDocumentBuilderService,
  DocumentSection,
  createHeadingSection,
  MODERN_THEME,
} from '@core/reports'

@Injectable()
export class CustomThemeReportService {
  constructor(
    private readonly themeManager: ThemeManagerService,
    private readonly builder: SimpleDocumentBuilderService,
  ) {}

  async generateWithCustomTheme(): Promise<Buffer> {
    // Crear tema personalizado
    const customTheme = this.themeManager.createCustomTheme({
      ...MODERN_THEME,
      colors: {
        ...MODERN_THEME.colors,
        primary: '0066CC', // Azul personalizado
        secondary: 'FF6600', // Naranja personalizado
      },
      headings: {
        ...MODERN_THEME.headings,
        h1: {
          size: 32,
          color: '0066CC',
          bold: true,
          spacing: { before: 400, after: 200 },
        },
      },
    })

    const sections: DocumentSection[] = [
      createHeadingSection('Título con tema custom', 1),
    ]

    return await this.builder.buildDocument({
      theme: customTheme,
      title: 'Reporte con Tema Custom',
      sections,
    })
  }
}
```

### Ejemplo 4: Reporte Completo con TOC, Headers y Footers

```typescript
import {
  SimpleDocumentBuilderService,
  DocumentSection,
  createHeadingSection,
  createParagraphSection,
  createTableOfContentsSection,
  createHeaderFooter,
  createTextContent,
  createPageNumberContent,
  MODERN_THEME,
} from '@core/reports'

@Injectable()
export class FullReportService {
  constructor(private readonly builder: SimpleDocumentBuilderService) {}

  async generateFullReport(): Promise<Buffer> {
    const sections: DocumentSection[] = [
      // Portada
      createHeadingSection('Reporte Completo', 1),
      { type: 'nextPageBreak' },

      // TOC
      createTableOfContentsSection({
        title: 'Índice',
        maxLevel: 3,
        includePageNumbers: true,
      }),
      { type: 'nextPageBreak' },

      // Contenido
      createHeadingSection('1. Introducción', 1),
      createParagraphSection('Contenido de la introducción...'),

      createHeadingSection('1.1 Objetivo', 2),
      createParagraphSection('Objetivo del reporte...'),

      createHeadingSection('2. Desarrollo', 1),
      createParagraphSection('Contenido del desarrollo...'),
    ]

    // Headers y footers
    const header = createHeaderFooter([
      createTextContent('Mi Empresa'),
      createTextContent('Confidencial'),
    ])

    const footer = createHeaderFooter([
      createTextContent('© 2024 Mi Empresa'),
      createPageNumberContent(),
    ])

    return await this.builder.buildDocument({
      theme: MODERN_THEME,
      title: 'Reporte Completo',
      sections,
      header,
      footer,
    })
  }
}
```

---

## Temas Disponibles

### MODERN_THEME (Por defecto)

```typescript
import { MODERN_THEME } from '@core/reports'

// Tema moderno con colores profesionales
// - Primary: #2563EB (Azul)
// - Secondary: #7C3AED (Púrpura)
// - Fuentes: Calibri / Arial
```

### Crear Tema Personalizado

```typescript
import { ThemeManagerService } from '@core/reports'

const customTheme = this.themeManager.createCustomTheme({
  name: 'Mi Tema',
  colors: {
    primary: 'FF0000',
    secondary: '00FF00',
    accent: '0000FF',
    text: '000000',
    background: 'FFFFFF',
    success: '10B981',
    warning: 'F59E0B',
    error: 'EF4444',
  },
  fonts: {
    heading: 'Arial',
    body: 'Times New Roman',
    monospace: 'Courier New',
  },
  // ... más configuraciones
})
```

---

## Configuración Avanzada

### Márgenes del Documento

```typescript
return await this.builder.buildDocument({
  theme: MODERN_THEME,
  title: 'Mi Reporte',
  sections,
  margins: {
    top: 720, // 1 pulgada = 1440 twips
    right: 720,
    bottom: 720,
    left: 720,
  },
})
```

### Validar Configuración

```typescript
import { validateDocumentConfig, DocumentConfig } from '@core/reports'

const config: DocumentConfig = {
  theme: MODERN_THEME,
  title: 'Mi Reporte',
  sections: [...],
}

const validation = validateDocumentConfig(config)

if (!validation.valid) {
  console.error('Errores:', validation.errors)
}

if (validation.warnings.length > 0) {
  console.warn('Advertencias:', validation.warnings)
}
```

---

## Mejores Prácticas

1. **Separa la lógica de negocio de la generación de reportes**
   - Crea servicios específicos en tu módulo
   - Usa `ReportsService` solo como infraestructura

2. **Usa helpers para simplificar el código**
   ```typescript
   // ❌ Malo
   sections.push({ type: 'heading', content: { text: 'Título', level: 1 } })

   // ✅ Bueno
   sections.push(createHeadingSection('Título', 1))
   ```

3. **Valida la configuración antes de generar**
   ```typescript
   const validation = validateDocumentConfig(config)
   if (!validation.valid) {
     throw new BadRequestException(validation.errors)
   }
   ```

4. **Usa temas para mantener consistencia**
   ```typescript
   // Define un tema corporativo y úsalo en todos los reportes
   const CORPORATE_THEME = this.themeManager.createCustomTheme(...)
   ```

5. **Maneja errores apropiadamente**
   ```typescript
   try {
     const buffer = await this.builder.buildDocument(config)
     return buffer
   } catch (error) {
     this.logger.error('Error generando reporte', error)
     throw new InternalServerErrorException('Error al generar reporte')
   }
   ```

---

## Tipos Principales

```typescript
// Importar tipos necesarios
import {
  DocumentConfig,
  DocumentSection,
  DocumentTheme,
  HeadingSection,
  ParagraphSection,
  TableSection,
  ListSection,
  ImageSection,
  TableOfContentsSection,
  StyledText,
  InlineTextStyle,
  HeaderFooterConfig,
} from '@core/reports'
```

---

## Recursos Adicionales

- Ver ejemplos completos en: `src/@core/reports/services/reports.service.ts`
- Interfaces completas en: `src/@core/reports/interfaces/index.ts`
- Temas disponibles en: `src/@core/reports/theme/index.ts`

---

## Preguntas Frecuentes

**Q: ¿Puedo usar este módulo desde cualquier módulo de negocio?**
A: Sí, solo importa `ReportsModule` en tu módulo y usa los servicios inyectados.

**Q: ¿Cómo exporto el reporte en un endpoint?**
A: Usa `@Res() res: Response` y configura headers apropiados (ver ejemplos arriba).

**Q: ¿Puedo convertir HTML a DOCX?**
A: Sí, usa `HtmlToSectionsConverterService.convertHtmlToSections()`.

**Q: ¿Cómo personalizo los estilos?**
A: Usa `ThemeManagerService.createCustomTheme()` o sobrescribe estilos por sección con `overrideTheme`.

**Q: ¿Dónde están los ejemplos completos?**
A: Ver `src/@core/reports/services/reports.service.ts` (método `generateFullDocumentWithOptions`).

---

## Licencia

Este módulo es parte del proyecto ATR (Audit Template Repository) y está disponible bajo la misma licencia del proyecto principal.

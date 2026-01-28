// themes/business.theme.ts
import { DocumentTheme } from '../interfaces'

export const BUSINESS_THEME: DocumentTheme = {
  name: 'Business',
  colors: {
    primary: '1f4e79', // Azul corporativo
    secondary: '70ad47', // Verde corporativo
    accent: 'c5504b', // Rojo para destacar
    text: '000000', // Negro para texto
    background: 'ffffff', // Blanco
    success: '70ad47', // Verde
    warning: 'ffc000', // Amarillo/naranja
    error: 'c5504b', // Rojo
  },
  fonts: {
    heading: 'Calibri',
    body: 'Calibri',
    monospace: 'Consolas',
  },
  headings: {
    h1: {
      size: 18,
      bold: true,
      spacing: { before: 480, after: 240 },
    },
    h2: {
      size: 16,
      bold: true,
      spacing: { before: 360, after: 180 },
    },
    h3: {
      size: 14,
      bold: true,
      spacing: { before: 240, after: 120 },
    },
    h4: {
      size: 12,
      bold: true,
      spacing: { before: 180, after: 90 },
    },
    h5: {
      size: 11,
      bold: true,
      spacing: { before: 120, after: 60 },
    },
    h6: {
      size: 10,
      bold: true,
      spacing: { before: 60, after: 30 },
    },
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 276,
    spacing: { before: 0, after: 120 },
    alignment: 'justify',
  },
  table: {
    headerBackground: '1f4e79',
    headerTextColor: 'ffffff',
    alternateRows: true,
    evenRowColor: 'f2f2f2',
    oddRowColor: 'ffffff',
    borderColor: '1f4e79',
    fontSize: 10,
  },

  header: {
    fontSize: 9,
    color: '666666',
    alignment: 'center',
    borderBottom: true,
  },
  footer: {
    fontSize: 9,
    color: '666666',
    alignment: 'center',
    borderTop: true,
  },

  tableOfContents: {
    title: 'Tabla de Contenidos',
    fontSize: 12,
    color: '1f4e79',
    includePageNumbers: true,
    maxLevel: 3,
  },
  list: {
    fontSize: 11,
    spacing: {
      before: 60,
      after: 120,
      between: 80,
    },
    indent: 360,
    bullet: {
      symbol: '•',
      color: '1f4e79',
    },
    numbered: {
      format: 'decimal',
      color: '1f4e79',
    },
  },
}

// themes/modern.theme.ts
export const MODERN_THEME: DocumentTheme = {
  name: 'Modern',
  colors: {
    primary: '2c3e50', // Azul oscuro moderno
    secondary: '3498db', // Azul claro
    accent: 'e74c3c', // Rojo moderno
    text: '2c3e50', // Azul oscuro para texto
    background: 'ffffff', // Blanco
    success: '27ae60', // Verde moderno
    warning: 'f39c12', // Naranja moderno
    error: 'e74c3c', // Rojo moderno
  },
  fonts: {
    heading: 'Calibri',
    body: 'Calibri',
    monospace: 'Consolas',
  },
  headings: {
    h1: {
      size: 24,
      bold: true,
      color: '2c3e50',
      spacing: { before: 480, after: 360 },
    },
    h2: {
      size: 18,
      bold: true,
      color: '3498db',
      spacing: { before: 360, after: 240 },
    },
    h3: {
      size: 16,
      bold: true,
      color: '3498db',
      spacing: { before: 240, after: 180 },
    },
    h4: {
      size: 14,
      bold: true,
      color: '2c3e50',
      spacing: { before: 180, after: 120 },
    },
    h5: {
      size: 12,
      bold: true,
      color: '2c3e50',
      spacing: { before: 120, after: 90 },
    },
    h6: {
      size: 11,
      bold: true,
      color: '2c3e50',
      spacing: { before: 90, after: 60 },
    },
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 300,
    spacing: { before: 0, after: 150 },
    alignment: 'left',
  },
  table: {
    headerBackground: '3498db',
    headerTextColor: 'ffffff',
    alternateRows: true,
    evenRowColor: 'ecf0f1',
    oddRowColor: 'ffffff',
    borderColor: '3498db',
    fontSize: 10,
  },
  header: {
    fontSize: 10,
    color: '7f8c8d',
    alignment: 'left',
    borderBottom: false,
  },
  footer: {
    fontSize: 9,
    color: '7f8c8d',
    alignment: 'right',
    borderTop: false,
  },
  tableOfContents: {
    title: 'Índice',
    fontSize: 14,
    color: '2c3e50',
    includePageNumbers: true,
    maxLevel: 4,
  },
  list: {
    fontSize: 11,
    spacing: {
      before: 60,
      after: 150,
      between: 90,
    },
    indent: 360,
    bullet: {
      symbol: '•',
      color: '3498db',
    },
    numbered: {
      format: 'decimal',
      color: '3498db',
    },
  },
}

// themes/creative.theme.ts - Tema adicional más creativo
export const CREATIVE_THEME: DocumentTheme = {
  name: 'Creative',
  colors: {
    primary: '9b59b6', // Púrpura
    secondary: 'f39c12', // Naranja
    accent: 'e67e22', // Naranja oscuro
    text: '2c3e50', // Azul oscuro
    background: 'ffffff', // Blanco
    success: '1abc9c', // Turquesa
    warning: 'f1c40f', // Amarillo
    error: 'e74c3c', // Rojo
  },
  fonts: {
    heading: 'Calibri',
    body: 'Calibri',
    monospace: 'Consolas',
  },
  headings: {
    h1: {
      size: 22,
      bold: true,
      color: '9b59b6',
      spacing: { before: 600, after: 300 },
    },
    h2: {
      size: 18,
      bold: true,
      color: 'f39c12',
      spacing: { before: 400, after: 200 },
    },
    h3: {
      size: 16,
      bold: true,
      color: 'e67e22',
      spacing: { before: 300, after: 150 },
    },
    h4: {
      size: 14,
      bold: true,
      spacing: { before: 200, after: 100 },
    },
    h5: {
      size: 12,
      bold: true,
      spacing: { before: 150, after: 75 },
    },
    h6: {
      size: 11,
      bold: true,
      spacing: { before: 100, after: 50 },
    },
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 320,
    spacing: { before: 0, after: 160 },
    alignment: 'justify',
  },
  table: {
    headerBackground: '9b59b6',
    headerTextColor: 'ffffff',
    alternateRows: true,
    evenRowColor: 'f8f9fa',
    oddRowColor: 'ffffff',
    borderColor: '9b59b6',
    fontSize: 11,
  },
  header: {
    fontSize: 10,
    color: '9b59b6',
    alignment: 'center',
    borderBottom: true,
  },
  footer: {
    fontSize: 9,
    color: '95a5a6',
    alignment: 'center',
    borderTop: false,
  },
  tableOfContents: {
    title: 'Contenido',
    fontSize: 16,
    color: '9b59b6',
    includePageNumbers: true,
    maxLevel: 3,
  },
  list: {
    fontSize: 12,
    spacing: {
      before: 80,
      after: 160,
      between: 100,
    },
    indent: 400,
    bullet: {
      symbol: '•',
      color: '9b59b6',
    },
    numbered: {
      format: 'decimal',
      color: 'f39c12',
    },
  },
}

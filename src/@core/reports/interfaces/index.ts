// interfaces/theme.interface.ts - Versión corregida para footer y tipos mejorados

export interface DocumentTheme {
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    text: string
    background: string
    success: string
    warning: string
    error: string
  }
  fonts: {
    heading: string
    body: string
    monospace: string
  }
  headings: {
    h1: HeadingConfig
    h2: HeadingConfig
    h3: HeadingConfig
    h4: HeadingConfig
    h5: HeadingConfig
    h6: HeadingConfig
  }
  paragraph: ParagraphConfig
  table: TableConfig
  list: ListConfig
  header?: HeaderFooterThemeConfig
  footer?: HeaderFooterThemeConfig // CORREGIDO: Tipo específico para footer
  tableOfContents?: TableOfContentsConfig
}

// Tipos específicos para configuraciones
interface HeadingConfig {
  size: number
  color?: string
  bold?: boolean
  spacing?: { before: number; after: number }
}

interface ParagraphConfig {
  fontSize: number
  lineHeight: number
  spacing: { before: number; after: number }
  alignment: 'left' | 'center' | 'right' | 'justify'
}

interface TableConfig {
  headerBackground: string
  headerTextColor: string
  alternateRows: boolean
  evenRowColor?: string
  oddRowColor?: string
  borderColor: string
  fontSize: number
}

interface ListConfig {
  fontSize: number
  spacing: { before: number; after: number; between: number }
  indent: number
  bullet: {
    symbol: string
    color?: string
  }
  numbered: {
    format: ListNumberFormat
    color?: string
  }
}

// CORREGIDO: Tipo específico para header/footer en el tema
interface HeaderFooterThemeConfig {
  fontSize: number
  color: string
  alignment: 'left' | 'center' | 'right'
  borderBottom?: boolean // Para header
  borderTop?: boolean // Para footer
}

interface TableOfContentsConfig {
  title: string
  fontSize: number
  color: string
  includePageNumbers: boolean
  maxLevel: 1 | 2 | 3 | 4 | 5 | 6
}

// Tipos para contenido de listas
export interface ListItem {
  text: string
  style?: ListItemStyle
  subItems?: ListItem[]
}

interface ListItemStyle {
  bold?: boolean
  italic?: boolean
  color?: string
  fontSize?: number
}

export interface ListContent {
  items: ListItem[]
  type: 'bullet' | 'numbered' | 'checklist' | 'arrow' | 'custom'
  maxNestingLevel?: number
  style?: ListLevelStyles
}

interface ListLevelStyles {
  [level: number]: ListLevelStyle
}

interface ListLevelStyle {
  symbol?: string
  format?: ListNumberFormat
  color?: string
  fontSize?: number
  bold?: boolean
  italic?: boolean
  indent?: number
}

export type ListNumberFormat =
  | 'decimal'
  | 'decimalZero'
  | 'decimalParens'
  | 'decimalPeriod'
  | 'lowerRoman'
  | 'upperRoman'
  | 'lowerLetter'
  | 'upperLetter'
  | 'lowerLetterParens'
  | 'upperLetterParens'
  | 'custom'

// Tipos para headers y footers
export interface HeaderFooterContent {
  type:
    | 'text'
    | 'pageNumber'
    | 'date'
    | 'image'
    | 'custom'
    | 'pageCount'
    | 'title'
  content?: string
  formatting?: TextFormatting
  // Para imágenes
  imageBuffer?: Buffer
  imageWidth?: number
  imageHeight?: number
}

interface TextFormatting {
  fontSize?: number
  color?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

export interface HeaderFooterConfig {
  columns: HeaderFooterContent[]
  columnWidths?: number[]
  alignment?: ('left' | 'center' | 'right')[]
  showBorder?: boolean
  backgroundColor?: string
  padding?: PaddingConfig
}

interface PaddingConfig {
  top?: number
  bottom?: number
  left?: number
  right?: number
}

// Tipos para contenido específico
export interface HeadingContent {
  text: string
  level: 1 | 2 | 3 | 4 | 5 | 6
}

export interface TableContent {
  headers: string[]
  rows: string[][]
  columnWidths?: number[]
}

export interface ImageContent {
  buffer: Buffer
  width?: number
  height?: number
  caption?: string
  captionPosition?: 'above' | 'below' | 'side'
  alignment?: 'left' | 'center' | 'right'
}

export interface SpacerContent {
  height: number
}

export interface HtmlContent {
  html: string
  fallbackText?: string
}

export interface TableOfContentsContent {
  title?: string
  maxLevel?: 1 | 2 | 3 | 4 | 5 | 6
  includePageNumbers?: boolean
}

// Tipos para secciones del documento
export type DocumentSection =
  | HeadingSection
  | ParagraphSection
  | TableSection
  | ImageSection
  | ListSection
  | HtmlSection
  | SpacerSection
  | PageBreakSection
  | NextPageBreakSection
  | TableOfContentsSection

export interface HeadingSection {
  type: 'heading'
  content: HeadingContent
  includeInTOC?: boolean
  tocText?: string
  overrideTheme?: Partial<DocumentTheme['headings']>
}

export interface ParagraphSection {
  type: 'paragraph'
  content: ParagraphContent
  overrideTheme?: Partial<DocumentTheme['paragraph']>
}

export interface TableSection {
  type: 'table'
  content: TableContent
  overrideTheme?: Partial<DocumentTheme['table']>
}

interface ImageSection {
  type: 'image'
  content: ImageContent
}

export interface ListSection {
  type: 'list'
  content: ListContent
  overrideTheme?: Partial<DocumentTheme['list']>
}

interface HtmlSection {
  type: 'html'
  content: HtmlContent
}

interface SpacerSection {
  type: 'spacer'
  content: SpacerContent
}

interface PageBreakSection {
  type: 'pageBreak'
}

interface NextPageBreakSection {
  type: 'nextPageBreak'
}

interface TableOfContentsSection {
  type: 'tableOfContents'
  content?: TableOfContentsContent
  overrideTheme?: Partial<DocumentTheme['tableOfContents']>
}

// Configuración principal del documento
export interface DocumentConfig {
  theme: DocumentTheme
  title: string
  sections: DocumentSection[]
  header?: HeaderFooterConfig
  footer?: HeaderFooterConfig
  margins?: MarginConfig
  tableOfContents?: TableOfContentsSettings
}

interface MarginConfig {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

interface TableOfContentsSettings {
  enabled: boolean
  title?: string
  includePageNumbers?: boolean
  maxLevel?: 1 | 2 | 3 | 4 | 5 | 6
  insertAtBeginning?: boolean
}

// HELPERS SIMPLIFICADOS: Funciones para crear secciones más fácilmente

export const createListSection = (
  items: (string | ListItemInput)[],
  type: ListContent['type'] = 'bullet',
  options?: ListSectionOptions,
): ListSection => {
  const listItems: ListItem[] = items.map((item) =>
    typeof item === 'string'
      ? { text: item }
      : {
          text: item.text,
          style: item.style,
          subItems: item.subItems?.map((subItem) =>
            typeof subItem === 'string'
              ? { text: subItem }
              : {
                  text: subItem.text,
                  style: subItem.style,
                  subItems: subItem.subItems?.map((subSubText) => ({
                    text: subSubText,
                  })),
                },
          ),
        },
  )

  return {
    type: 'list',
    content: {
      items: listItems,
      type,
      style: options?.levelStyles,
      maxNestingLevel: 3,
    },
    overrideTheme: options?.overrideTheme,
  }
}

interface ListItemInput {
  text: string
  style?: ListItemStyle
  subItems?: (
    | string
    | {
        text: string
        style?: ListItemStyle
        subItems?: string[]
      }
  )[]
}

interface ListSectionOptions {
  levelStyles?: ListLevelStyles
  overrideTheme?: Partial<DocumentTheme['list']>
}

// Helpers específicos para diferentes tipos de listas
export const createBulletList = (
  items: string[],
  customSymbols?: Record<number, string>,
): ListSection =>
  createListSection(
    items,
    'bullet',
    customSymbols
      ? {
          levelStyles: Object.fromEntries(
            Object.entries(customSymbols).map(([level, symbol]) => [
              level,
              { symbol },
            ]),
          ),
        }
      : undefined,
  )

export const createNumberedList = (
  items: string[],
  format: ListNumberFormat = 'decimal',
): ListSection =>
  createListSection(items, 'numbered', {
    levelStyles: { 0: { format } },
  })

export const createCustomList = (
  items: (string | { text: string; subItems?: string[] })[],
  levelConfig: ListLevelStyles,
): ListSection =>
  createListSection(items, 'custom', { levelStyles: levelConfig })

// Otros helpers
export const createHeadingSection = (
  text: string,
  level: HeadingContent['level'],
  options?: {
    includeInTOC?: boolean
    tocText?: string
    overrideTheme?: Partial<DocumentTheme['headings']>
  },
): HeadingSection => ({
  type: 'heading',
  content: { text, level },
  ...options,
})

export const createParagraphSection = (
  text: string,
  options?: {
    alignment?: ParagraphContent['alignment']
    overrideTheme?: Partial<DocumentTheme['paragraph']>
  },
): ParagraphSection => ({
  type: 'paragraph',
  content: { text, alignment: options?.alignment },
  overrideTheme: options?.overrideTheme,
})

export const createTableSection = (
  headers: string[],
  rows: string[][],
  options?: {
    columnWidths?: number[]
    overrideTheme?: Partial<DocumentTheme['table']>
  },
): TableSection => ({
  type: 'table',
  content: { headers, rows, columnWidths: options?.columnWidths },
  overrideTheme: options?.overrideTheme,
})

export const createImageSection = (
  buffer: Buffer,
  options?: Partial<Omit<ImageContent, 'buffer'>>,
): ImageSection => ({
  type: 'image',
  content: {
    buffer,
    captionPosition: 'below',
    ...options,
  },
})

export const createSpacerSection = (height: number): SpacerSection => ({
  type: 'spacer',
  content: { height },
})

export const createPageBreakSection = (): PageBreakSection => ({
  type: 'pageBreak',
})

export const createNextPageBreakSection = (): NextPageBreakSection => ({
  type: 'nextPageBreak',
})

export const createTableOfContentsSection = (
  options?: TableOfContentsContent & {
    overrideTheme?: Partial<DocumentTheme['tableOfContents']>
  },
): TableOfContentsSection => ({
  type: 'tableOfContents',
  content: options
    ? {
        title: options.title,
        maxLevel: options.maxLevel,
        includePageNumbers: options.includePageNumbers,
      }
    : undefined,
  overrideTheme: options?.overrideTheme,
})

// Helpers para crear headers y footers
export const createHeaderFooter = (
  columns: HeaderFooterContent[],
  options?: HeaderFooterOptions,
): HeaderFooterConfig => {
  const numColumns = columns.length

  // Cálculo automático de anchos de columna
  const columnWidths =
    options?.columnWidths || calculateDefaultColumnWidths(numColumns)

  // Cálculo automático de alineaciones
  const alignment = options?.alignment || calculateDefaultAlignments(numColumns)

  return {
    columns,
    columnWidths,
    alignment,
    showBorder: options?.showBorder || false,
    backgroundColor: options?.backgroundColor,
    padding: options?.padding || {
      top: 72,
      bottom: 72,
      left: 72,
      right: 72,
    },
  }
}

interface HeaderFooterOptions {
  columnWidths?: number[]
  alignment?: ('left' | 'center' | 'right')[]
  showBorder?: boolean
  backgroundColor?: string
  padding?: PaddingConfig
}

// Funciones helper para cálculos automáticos
function calculateDefaultColumnWidths(numColumns: number): number[] {
  const distributions: Record<number, number[]> = {
    1: [100],
    2: [50, 50],
    3: [33.33, 33.33, 33.34],
  }

  return (
    distributions[numColumns] || new Array(numColumns).fill(100 / numColumns)
  )
}

function calculateDefaultAlignments(
  numColumns: number,
): ('left' | 'center' | 'right')[] {
  const alignments: Record<number, ('left' | 'center' | 'right')[]> = {
    1: ['center'],
    2: ['left', 'right'],
    3: ['left', 'center', 'right'],
  }

  return alignments[numColumns] || new Array(numColumns).fill('left')
}

// Helpers para crear contenido específico de headers/footers
export const createTextContent = (
  text: string,
  formatting?: TextFormatting,
): HeaderFooterContent => ({
  type: 'text',
  content: text,
  formatting,
})

export const createPageNumberContent = (
  formatting?: TextFormatting,
): HeaderFooterContent => ({
  type: 'pageNumber',
  formatting,
})

export const createDateContent = (
  formatting?: TextFormatting,
): HeaderFooterContent => ({
  type: 'date',
  formatting,
})

export const createImageContent = (
  buffer: Buffer,
  width: number = 50,
  height: number = 50,
): HeaderFooterContent => ({
  type: 'image',
  imageBuffer: buffer,
  imageWidth: width,
  imageHeight: height,
})

export const createTitleContent = (
  formatting?: TextFormatting,
): HeaderFooterContent => ({
  type: 'title',
  formatting,
})

export const createPageCountContent = (
  formatting?: TextFormatting,
): HeaderFooterContent => ({
  type: 'pageCount',
  formatting,
})

// Tipos de validación para mejor type safety
export interface DocumentValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  value?: unknown
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

// Helper para validar configuración de documento
export const validateDocumentConfig = (
  config: DocumentConfig,
): DocumentValidationResult => {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Validar título
  if (!config.title || config.title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'El título del documento es obligatorio',
      value: config.title,
    })
  }

  // Validar secciones
  if (!config.sections || config.sections.length === 0) {
    errors.push({
      field: 'sections',
      message: 'El documento debe tener al menos una sección',
      value: config.sections?.length,
    })
  }

  // Validar márgenes
  if (config.margins) {
    Object.entries(config.margins).forEach(([key, value]) => {
      if (value !== undefined && (value < 0 || value > 2000)) {
        warnings.push({
          field: `margins.${key}`,
          message: 'El margen está fuera del rango recomendado (0-2000)',
          suggestion: 'Usar valores entre 360 (0.5") y 1440 (2")',
        })
      }
    })
  }

  // Validar TOC
  if (
    config.tableOfContents?.enabled &&
    config.tableOfContents.maxLevel &&
    config.tableOfContents.maxLevel > 6
  ) {
    errors.push({
      field: 'tableOfContents.maxLevel',
      message: 'El nivel máximo de TOC no puede ser mayor a 6',
      value: config.tableOfContents.maxLevel,
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export interface StyledText {
  text: string
  style?: InlineTextStyle
}

// NUEVO: Estilos inline disponibles
export interface InlineTextStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  color?: string // Color hexadecimal sin #
  backgroundColor?: string // Color de fondo hexadecimal sin #
  fontSize?: number // Tamaño relativo al párrafo base
  font?: string // Fuente específica
  superscript?: boolean
  subscript?: boolean
}

// ACTUALIZADO: Contenido de párrafo puede ser string simple o array de texto estilizado
export interface ParagraphContent {
  text?: string // Para compatibilidad con párrafos simples
  styledText?: StyledText[] // NUEVO: Para texto con estilos inline
  alignment?: 'left' | 'center' | 'right' | 'justify'
}

// NUEVO: Helper para crear texto estilizado fácilmente
export const createStyledText = (
  text: string,
  style?: InlineTextStyle,
): StyledText => ({
  text,
  style,
})

// NUEVO: Helper para crear párrafos con texto mixto
export const createStyledParagraph = (
  textParts: (string | StyledText)[],
  options?: {
    alignment?: ParagraphContent['alignment']
    overrideTheme?: Partial<DocumentTheme['paragraph']>
  },
): Extract<DocumentSection, { type: 'paragraph' }> => {
  const styledText: StyledText[] = textParts.map((part) =>
    typeof part === 'string' ? { text: part } : part,
  )

  return {
    type: 'paragraph',
    content: {
      styledText,
      alignment: options?.alignment,
    },
    overrideTheme: options?.overrideTheme,
  }
}

// NUEVO: Helpers específicos para estilos comunes
export const bold = (text: string): StyledText =>
  createStyledText(text, { bold: true })

export const italic = (text: string): StyledText =>
  createStyledText(text, { italic: true })

export const underline = (text: string): StyledText =>
  createStyledText(text, { underline: true })

export const strikethrough = (text: string): StyledText =>
  createStyledText(text, { strikethrough: true })

export const colored = (text: string, color: string): StyledText =>
  createStyledText(text, { color })

export const highlighted = (
  text: string,
  backgroundColor: string,
): StyledText => createStyledText(text, { backgroundColor })

export const superscript = (text: string): StyledText =>
  createStyledText(text, { superscript: true })

export const subscript = (text: string): StyledText =>
  createStyledText(text, { subscript: true })

// NUEVO: Helper para combinar múltiples estilos
export const styled = (text: string, styles: InlineTextStyle): StyledText =>
  createStyledText(text, styles)

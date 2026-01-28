// simple-document-builder.service.ts - Versión refactorizada con tipos y métodos simplificados
import { Injectable, Logger } from '@nestjs/common'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  ShadingType,
  BorderStyle,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  TableOfContents,
  UnderlineType,
  PageBreak,
} from 'docx'
import { ThemeManagerService } from './theme.service'
import {
  DocumentConfig,
  HeaderFooterConfig,
  TableContent,
  DocumentSection,
  DocumentTheme,
  ListContent,
  ListItem,
  ListNumberFormat,
  ParagraphContent,
  StyledText,
  InlineTextStyle,
} from '../interfaces'
import { HtmlToSectionsConverterService } from './html-docx.service'

type DocumentChild = Paragraph | Table | TableOfContents

// Tipos específicos para configuración de listas
interface ListLevelConfig {
  symbol?: string
  format?: ListNumberFormat
  color: string
  fontSize: number
  indent: number
  bold: boolean
  italic: boolean
}

interface ProcessedListConfig {
  items: ListItem[]
  type: string
  fontSize: number
  spacing: { before: number; after: number; between: number }
  indent: number
  color: string
  font: string
  maxNestingLevel: number
  style: Record<number, ListLevelConfig>
}

interface TOCItem {
  text: string
  level: number
  id: string
}

@Injectable()
export class SimpleDocumentBuilderService {
  private readonly logger = new Logger(SimpleDocumentBuilderService.name)
  private headingsForTOC: TOCItem[] = []
  private documentTitle: string = ''

  constructor(
    private readonly themeManager: ThemeManagerService,
    private readonly htmlService: HtmlToSectionsConverterService,
  ) {}

  async buildDocument(config: DocumentConfig): Promise<Buffer> {
    try {
      this.headingsForTOC = []
      this.documentTitle = config.title

      const children = await this.buildDocumentChildren(config)
      const doc = this.createDocumentStructure(config, children)

      return await Packer.toBuffer(doc)
    } catch (error) {
      this.logger.error('Error construyendo documento:', error)
      throw error
    }
  }

  private async buildDocumentChildren(
    config: DocumentConfig,
  ): Promise<DocumentChild[]> {
    const children: DocumentChild[] = []

    // Insertar TOC al inicio si está configurado
    if (
      config.tableOfContents?.enabled &&
      config.tableOfContents?.insertAtBeginning
    ) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: '', break: 1 })] }),
        this.createTableOfContents(config),
        new Paragraph({ children: [new TextRun({ text: '', break: 1 })] }),
      )
    }

    // Procesar secciones
    for (const section of config.sections) {
      const sectionElement = await this.processSectionElement(section, config)
      if (Array.isArray(sectionElement)) {
        children.push(...sectionElement)
      } else {
        children.push(sectionElement)
      }
    }

    return children
  }

  private async processSectionElement(
    section: DocumentSection,
    config: DocumentConfig,
  ): Promise<DocumentChild | DocumentChild[]> {
    switch (section.type) {
      case 'heading':
        this.addHeadingToTOC(section, config)
        return this.createThemedHeading(section.content, config.theme)

      case 'paragraph':
        return this.createThemedParagraph(
          section.content,
          config.theme,
          section.overrideTheme,
        )

      case 'table':
        return this.createThemedTable(
          section.content,
          config.theme,
          section.overrideTheme,
        )

      case 'image':
        return await this.createThemedImageDetailed(
          section.content,
          config.theme,
        )

      case 'list':
        return this.createSimpleList(
          section.content,
          config.theme,
          section.overrideTheme,
        )

      case 'html':
        // NUEVO: Convertir HTML a secciones y procesarlas recursivamente
        const htmlSections = this.htmlService.convertHtmlToSections(
          section.content.html,
        )
        const processedSections: DocumentChild[] = []

        for (const htmlSection of htmlSections) {
          const processed = await this.processSectionElement(
            htmlSection,
            config,
          )
          if (Array.isArray(processed)) {
            processedSections.push(...processed)
          } else {
            processedSections.push(processed)
          }
        }

        return processedSections

      case 'tableOfContents':
        return this.createTableOfContents(config)

      case 'spacer':
        return new Paragraph({
          spacing: { after: section.content?.height || 240 },
          children: [new TextRun({ text: '' })],
        })

      case 'pageBreak':
        return new Paragraph({
          children: [new TextRun({ text: '', break: 1 })],
        })

      case 'nextPageBreak':
        return new Paragraph({
          children: [new PageBreak()],
        })

      default:
        throw new Error(
          `Tipo de sección no soportado: ${(section as any).type}`,
        )
    }
  }

  // SIMPLIFICADO: Método principal para crear listas
  private createSimpleList(
    content: ListContent,
    theme: DocumentTheme,
    overrideTheme?: Partial<DocumentTheme['list']>,
  ): Paragraph[] {
    const config = this.buildListConfiguration(content, theme, overrideTheme)
    return this.buildListParagraphs(content.items, config)
  }

  // NUEVO: Construir configuración de lista de manera clara
  private buildListConfiguration(
    content: ListContent,
    theme: DocumentTheme,
    overrideTheme?: Partial<DocumentTheme['list']>,
  ): ProcessedListConfig {
    const baseConfig = this.themeManager.applyThemeToList(content, theme)

    // Aplicar overrides si existen
    const finalConfig = overrideTheme
      ? this.themeManager.applyListOverrides(
          baseConfig,
          overrideTheme,
          content.style,
        )
      : baseConfig

    return finalConfig
  }

  // SIMPLIFICADO: Construir todos los párrafos de la lista
  private buildListParagraphs(
    items: ListItem[],
    config: ProcessedListConfig,
    level: number = 0,
  ): Paragraph[] {
    const paragraphs: Paragraph[] = []

    items.forEach((item, index) => {
      // Agregar párrafo principal
      paragraphs.push(
        this.createSingleListParagraph(item, level, index, config),
      )

      // Procesar sub-elementos recursivamente
      if (item.subItems && item.subItems.length > 0) {
        paragraphs.push(
          ...this.buildListParagraphs(item.subItems, config, level + 1),
        )
      }
    })

    return paragraphs
  }

  // SIMPLIFICADO: Crear un solo párrafo de lista
  private createSingleListParagraph(
    item: ListItem,
    level: number,
    index: number,
    config: ProcessedListConfig,
  ): Paragraph {
    const levelConfig = this.getLevelConfiguration(level, config)
    const bullet = this.generateBulletText(
      config.type,
      level,
      index,
      levelConfig,
    )

    return new Paragraph({
      children: [
        new TextRun({
          text: bullet,
          size: levelConfig.fontSize * 2,
          color: levelConfig.color,
          bold: levelConfig.bold,
          italics: levelConfig.italic,
          font: config.font,
        }),
        new TextRun({
          text: `\t${item.text}`,
          size: (item.style?.fontSize || levelConfig.fontSize) * 2,
          color: item.style?.color || levelConfig.color,
          bold: item.style?.bold || levelConfig.bold,
          italics: item.style?.italic || levelConfig.italic,
          font: config.font,
        }),
      ],
      indent: {
        left: levelConfig.indent,
        hanging: 180,
      },
      spacing: {
        before:
          level === 0 ? config.spacing.before : config.spacing.between / 2,
        after: config.spacing.between / 2,
      },
      tabStops: [{ type: 'left' as const, position: 180 }],
    })
  }

  // SIMPLIFICADO: Obtener configuración de nivel
  private getLevelConfiguration(
    level: number,
    config: ProcessedListConfig,
  ): ListLevelConfig {
    return (
      config.style[level] ||
      config.style[0] || {
        color: config.color,
        fontSize: config.fontSize,
        indent: config.indent + level * 360,
        bold: false,
        italic: false,
      }
    )
  }

  // SIMPLIFICADO: Generar texto del bullet/número
  private generateBulletText(
    listType: string,
    level: number,
    index: number,
    levelConfig: ListLevelConfig,
  ): string {
    // Prioridad 1: Símbolo personalizado
    if (levelConfig.symbol) {
      return levelConfig.symbol
    }

    // Prioridad 2: Formato personalizado para numeradas
    if (listType === 'numbered' && levelConfig.format) {
      return this.formatNumberWithStyle(index + 1, levelConfig.format)
    }

    // Prioridad 3: Configuraciones por defecto
    return this.getDefaultBulletSymbol(listType, level, index)
  }

  private getDefaultBulletSymbol(
    listType: string,
    level: number,
    index: number,
  ): string {
    const symbols = {
      bullet: ['•', '◦', '▪', '▫', '‣'],
      numbered: () => this.formatNumberWithStyle(index + 1, 'decimal'),
      checklist: ['☐', '☑', '✓', '✗'],
      arrow: ['→', '⇒', '▶', '►', '⟩'],
      custom: ['•', '◦', '▪'],
    }

    const symbolArray = symbols[listType as keyof typeof symbols]

    if (typeof symbolArray === 'function') {
      return symbolArray()
    }

    if (Array.isArray(symbolArray)) {
      return symbolArray[level % symbolArray.length]
    }

    return '•' // Fallback
  }

  private formatNumberWithStyle(num: number, format: ListNumberFormat): string {
    const formatters: Record<ListNumberFormat, (n: number) => string> = {
      decimal: (n) => `${n}.`,
      decimalZero: (n) => `${n.toString().padStart(2, '0')}.`,
      decimalParens: (n) => `${n})`,
      decimalPeriod: (n) => `${n}.`,
      lowerRoman: (n) => `${this.toRoman(n).toLowerCase()}.`,
      upperRoman: (n) => `${this.toRoman(n)}.`,
      lowerLetter: (n) => `${String.fromCharCode(96 + n)}.`,
      upperLetter: (n) => `${String.fromCharCode(64 + n)}.`,
      lowerLetterParens: (n) => `${String.fromCharCode(96 + n)})`,
      upperLetterParens: (n) => `${String.fromCharCode(64 + n)})`,
      custom: (n) => `${n}.`,
    }

    return formatters[format]?.(num) || `${num}.`
  }

  private toRoman(num: number): string {
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    const symbols = [
      'M',
      'CM',
      'D',
      'CD',
      'C',
      'XC',
      'L',
      'XL',
      'X',
      'IX',
      'V',
      'IV',
      'I',
    ]
    let result = ''

    for (let i = 0; i < values.length; i++) {
      while (num >= values[i]) {
        result += symbols[i]
        num -= values[i]
      }
    }
    return result
  }

  // Métodos helper para TOC y headings
  private addHeadingToTOC(
    section: Extract<DocumentSection, { type: 'heading' }>,
    config: DocumentConfig,
  ): void {
    if (section.includeInTOC !== false && config.tableOfContents?.enabled) {
      this.addToTOC(
        section.tocText || section.content.text,
        section.content.level,
        `heading_${this.headingsForTOC.length + 1}`,
      )
    }
  }

  private addToTOC(text: string, level: number, id: string): void {
    this.headingsForTOC.push({ text, level, id })
  }

  // Métodos de creación de documento (mantenidos igual)
  private createDocumentStructure(
    config: DocumentConfig,
    children: DocumentChild[],
  ): Document {
    const headers = config.header
      ? this.createHeadersWithTable(config)
      : undefined
    const footers = config.footer
      ? this.createFootersWithTable(config)
      : undefined

    return new Document({
      styles: this.buildDocumentStyles(config.theme),
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: config.margins?.top || 720,
                right: config.margins?.right || 720,
                bottom: config.margins?.bottom || 720,
                left: config.margins?.left || 720,
              },
            },
          },
          headers,
          footers,
          children,
        },
      ],
    })
  }

  private buildDocumentStyles(theme: DocumentTheme) {
    return {
      default: {
        heading1: {
          run: {
            size: theme.headings.h1.size * 2,
            bold: theme.headings.h1.bold ?? true,
            color: theme.headings.h1.color || theme.colors.primary,
          },
          paragraph: { spacing: theme.headings.h1.spacing },
        },
        heading2: {
          run: {
            size: theme.headings.h2.size * 2,
            bold: theme.headings.h2.bold ?? true,
            color: theme.headings.h2.color || theme.colors.secondary,
          },
          paragraph: { spacing: theme.headings.h2.spacing },
        },
        heading3: {
          run: {
            size: theme.headings.h3.size * 2,
            bold: theme.headings.h3.bold ?? true,
            color: theme.headings.h3.color || theme.colors.secondary,
          },
          paragraph: { spacing: theme.headings.h3.spacing },
        },
      },
    }
  }

  // Resto de métodos mantenidos pero con tipos mejorados...
  private createThemedHeading(
    content: { text: string; level: 1 | 2 | 3 | 4 | 5 | 6 },
    theme: DocumentTheme,
  ): Paragraph {
    const config = this.themeManager.applyThemeToHeading(content, theme)
    return new Paragraph({
      heading: this.getHeadingLevel(content.level),
      spacing: config.spacing,
      children: [
        new TextRun({
          text: config.text,
          size: config.size * 2,
          color: config.color,
          bold: config.bold,
          font: config.font,
        }),
      ],
    })
  }

  private createThemedParagraph(
    content: ParagraphContent,
    theme: DocumentTheme,
    overrideTheme?: Partial<DocumentTheme['paragraph']>,
  ): Paragraph {
    // Determinar configuración final del párrafo
    const finalTheme = overrideTheme
      ? { ...theme.paragraph, ...overrideTheme }
      : theme.paragraph

    // Crear TextRuns según el tipo de contenido
    const textRuns = this.createTextRuns(content, theme, finalTheme)

    return new Paragraph({
      alignment: this.getAlignment(content.alignment || finalTheme.alignment),
      spacing: finalTheme.spacing,
      children: textRuns,
    })
  }

  private createTextRuns(
    content: ParagraphContent,
    theme: DocumentTheme,
    paragraphTheme: DocumentTheme['paragraph'],
  ): TextRun[] {
    // Si es texto simple (compatibilidad hacia atrás)
    if (content.text && !content.styledText) {
      return [
        new TextRun({
          text: content.text,
          size: paragraphTheme.fontSize * 2,
          color: theme.colors.text,
          font: theme.fonts.body,
        }),
      ]
    }

    // Si es texto estilizado
    if (content.styledText && content.styledText.length > 0) {
      return content.styledText.map((styledText) =>
        this.createStyledTextRun(styledText, theme, paragraphTheme),
      )
    }

    // Fallback: párrafo vacío
    return [new TextRun({ text: '', size: paragraphTheme.fontSize * 2 })]
  }

  // NUEVO: Crear un TextRun individual con estilos aplicados
  private createStyledTextRun(
    styledText: StyledText,
    theme: DocumentTheme,
    paragraphTheme: DocumentTheme['paragraph'],
  ): TextRun {
    const style = styledText.style || {}

    // Calcular propiedades finales
    const fontSize = this.calculateFinalFontSize(
      style.fontSize,
      paragraphTheme.fontSize,
    )
    const color = style.color || theme.colors.text
    const font = style.font || theme.fonts.body

    // Configurar subrayado
    const underline = this.configureUnderline(style, color)

    // Configurar shading (color de fondo)
    const shading = style.backgroundColor
      ? {
          type: ShadingType.SOLID,
          color: style.backgroundColor,
        }
      : undefined

    return new TextRun({
      text: styledText.text,
      size: fontSize * 2, // docx usa half-points
      color: color,
      font: font,
      bold: style.bold || false,
      italics: style.italic || false,
      underline: underline,
      strike: style.strikethrough || false,
      superScript: style.superscript || false,
      subScript: style.subscript || false,
      shading: shading,
    })
  }

  // NUEVO: Calcular tamaño de fuente final
  private calculateFinalFontSize(
    styleFontSize: number | undefined,
    baseFontSize: number,
  ): number {
    if (styleFontSize !== undefined) {
      return Math.max(1, styleFontSize)
    }
    return baseFontSize
  }

  // NUEVO: Configurar subrayado con color
  private configureUnderline(
    style: InlineTextStyle,
    defaultColor: string,
  ):
    | {
        type: (typeof UnderlineType)[keyof typeof UnderlineType]
        color?: string
      }
    | undefined {
    if (!style.underline) return undefined

    return {
      type: UnderlineType.SINGLE,
      color: style.color || defaultColor,
    }
  }

  // NUEVO: Helper para crear párrafos estilizados más fácilmente
  createAdvancedParagraph(
    textParts: (string | StyledText)[],
    options?: {
      alignment?: ParagraphContent['alignment']
      spacing?: { before?: number; after?: number }
      overrideTheme?: Partial<DocumentTheme['paragraph']>
    },
  ): Extract<DocumentSection, { type: 'paragraph' }> {
    const styledText: StyledText[] = textParts.map((part) =>
      typeof part === 'string' ? { text: part } : part,
    )

    const content: ParagraphContent = {
      styledText,
      alignment: options?.alignment,
    }

    const overrideTheme = options?.spacing
      ? {
          ...options.overrideTheme,
          spacing: {
            before:
              options.spacing.before ||
              options.overrideTheme?.spacing?.before ||
              0,
            after:
              options.spacing.after ||
              options.overrideTheme?.spacing?.after ||
              0,
          },
        }
      : options?.overrideTheme

    return {
      type: 'paragraph',
      content,
      overrideTheme,
    }
  }

  // NUEVO: Helpers adicionales para combinar estilos complejos
  static createMultiStyleText(
    text: string,
    ...styles: Partial<InlineTextStyle>[]
  ): StyledText {
    const combinedStyle: InlineTextStyle = {}

    styles.forEach((style) => {
      Object.assign(combinedStyle, style)
    })

    return { text, style: combinedStyle }
  }

  // NUEVO: Helper para crear texto con múltiples colores
  static createColoredText(
    text: string,
    textColor: string,
    backgroundColor?: string,
  ): StyledText {
    return {
      text,
      style: {
        color: textColor,
        backgroundColor,
      },
    }
  }

  // NUEVO: Helper para texto con formato completo
  static createRichText(
    text: string,
    config: {
      bold?: boolean
      italic?: boolean
      underline?: boolean
      strikethrough?: boolean
      color?: string
      backgroundColor?: string
      fontSize?: number
      font?: string
      superscript?: boolean
      subscript?: boolean
    },
  ): StyledText {
    return { text, style: config }
  }

  private createThemedTable(
    content: TableContent,
    theme: DocumentTheme,
    overrideTheme?: Partial<DocumentTheme['table']>,
  ): Table {
    const config = this.themeManager.applyThemeToTable(content, theme)
    const finalTheme = overrideTheme
      ? { ...theme.table, ...overrideTheme }
      : theme.table

    // Crear fila de headers
    const headerRow = new TableRow({
      children: config.headers.map(
        (header: string | { content: string }) =>
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: typeof header === 'string' ? header : header.content,
                    bold: true,
                    color: finalTheme.headerTextColor,
                    size: finalTheme.fontSize * 2,
                    font: theme.fonts.body,
                  }),
                ],
              }),
            ],
            shading: {
              type: ShadingType.SOLID,
              color: finalTheme.headerBackground,
            },
          }),
      ),
    })

    // Crear filas de datos
    const dataRows = config.rows.map(
      (row: (string | { content: string })[], rowIndex: number) =>
        new TableRow({
          children: row.map(
            (cell: string | { content: string }) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: typeof cell === 'string' ? cell : cell.content,
                        size: finalTheme.fontSize * 2,
                        font: theme.fonts.body,
                      }),
                    ],
                  }),
                ],
                shading: finalTheme.alternateRows
                  ? {
                      type: ShadingType.SOLID,
                      color:
                        rowIndex % 2 === 0
                          ? finalTheme.evenRowColor!
                          : finalTheme.oddRowColor!,
                    }
                  : undefined,
              }),
          ),
        }),
    )

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
      borders: {
        top: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: finalTheme.borderColor,
        },
        bottom: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: finalTheme.borderColor,
        },
        left: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: finalTheme.borderColor,
        },
        right: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: finalTheme.borderColor,
        },
        insideHorizontal: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: finalTheme.borderColor,
        },
        insideVertical: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: finalTheme.borderColor,
        },
      },
    })
  }

  // Headers y footers (mantenidos igual pero con tipos mejorados)
  private createHeadersWithTable(
    config: DocumentConfig,
  ): { default: Header } | undefined {
    if (!config.header) return undefined

    const table = this.createHeaderFooterTable(
      config.header,
      config.theme,
      'header',
    )
    return { default: new Header({ children: [table] }) }
  }

  private createFootersWithTable(
    config: DocumentConfig,
  ): { default: Footer } | undefined {
    if (!config.footer) return undefined

    const table = this.createHeaderFooterTable(
      config.footer,
      config.theme,
      'footer',
    )
    return { default: new Footer({ children: [table] }) }
  }

  private createHeaderFooterTable(
    config: HeaderFooterConfig,
    theme: DocumentTheme,
    type: 'header' | 'footer',
  ): Table {
    const numColumns = config.columns.length
    const columnWidths = this.calculateColumnWidths(
      numColumns,
      config.columnWidths,
    )
    const alignments = this.calculateColumnAlignments(
      numColumns,
      config.alignment,
    )

    const cells: TableCell[] = config.columns.map((column, index) => {
      const content = this.createHeaderFooterContent(column, theme, type)

      return new TableCell({
        children: [
          new Paragraph({
            alignment: this.getAlignment(alignments[index]),
            children: content,
          }),
        ],
        width: { size: columnWidths[index], type: WidthType.PERCENTAGE },
        margins: config.padding
          ? {
              top: config.padding.top || 72,
              bottom: config.padding.bottom || 72,
              left: config.padding.left || 72,
              right: config.padding.right || 72,
            }
          : undefined,
        shading: config.backgroundColor
          ? {
              type: ShadingType.SOLID,
              color: config.backgroundColor,
            }
          : undefined,
      })
    })

    const row = new TableRow({ children: cells })

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [row],
      borders: this.createTableBorders(config, theme),
    })
  }

  private createTableBorders(config: HeaderFooterConfig, theme: DocumentTheme) {
    const borderStyle = config.showBorder
      ? { style: BorderStyle.SINGLE, size: 1, color: theme.colors.text }
      : { style: BorderStyle.NONE, size: 0 }

    return {
      top: borderStyle,
      bottom: borderStyle,
      left: { style: BorderStyle.NONE, size: 0 },
      right: { style: BorderStyle.NONE, size: 0 },
      insideHorizontal: { style: BorderStyle.NONE, size: 0 },
      insideVertical: { style: BorderStyle.NONE, size: 0 },
    }
  }

  private createHeaderFooterContent(
    content: HeaderFooterConfig['columns'][0],
    theme: DocumentTheme,
    type: 'header' | 'footer',
  ): (TextRun | ImageRun)[] {
    const defaultTheme = type === 'header' ? theme.header : theme.footer
    const fontSize =
      content.formatting?.fontSize || defaultTheme?.fontSize || 10
    const color =
      content.formatting?.color || defaultTheme?.color || theme.colors.text

    switch (content.type) {
      case 'text':
        return [
          new TextRun({
            text: content.content || '',
            size: fontSize * 2,
            color,
            bold: content.formatting?.bold,
            italics: content.formatting?.italic,
            underline: content.formatting?.underline
              ? { type: UnderlineType.SINGLE, color }
              : undefined,
          }),
        ]

      case 'pageNumber':
        return [
          new TextRun({
            children: [PageNumber.CURRENT],
            size: fontSize * 2,
            color,
            bold: content.formatting?.bold,
            italics: content.formatting?.italic,
          }),
        ]

      case 'date':
        return [
          new TextRun({
            text: new Date().toLocaleDateString(),
            size: fontSize * 2,
            color,
            bold: content.formatting?.bold,
            italics: content.formatting?.italic,
          }),
        ]

      case 'title':
        return [
          new TextRun({
            text: this.documentTitle,
            size: fontSize * 2,
            color,
            bold: content.formatting?.bold,
            italics: content.formatting?.italic,
          }),
        ]

      case 'image':
        if (content.imageBuffer) {
          try {
            return [
              new ImageRun({
                data: content.imageBuffer,
                transformation: {
                  width: content.imageWidth || 50,
                  height: content.imageHeight || 50,
                },
                type: 'png',
              }),
            ]
          } catch (error) {
            this.logger.error('Error creando imagen en header/footer:', error)
            return [
              new TextRun({
                text: '[Error de imagen]',
                size: fontSize * 2,
                color: theme.colors.error,
                italics: true,
              }),
            ]
          }
        }
        return [new TextRun({ text: '', size: fontSize * 2 })]

      default:
        return [
          new TextRun({
            text: content.content || '',
            size: fontSize * 2,
            color,
            bold: content.formatting?.bold,
            italics: content.formatting?.italic,
          }),
        ]
    }
  }

  // Métodos auxiliares
  private calculateColumnWidths(
    numColumns: number,
    specified?: number[],
  ): number[] {
    if (specified && specified.length === numColumns) {
      const sum = specified.reduce((a, b) => a + b, 0)
      if (Math.abs(sum - 100) < 0.01) {
        return specified
      }
      return specified.map((w) => (w / sum) * 100)
    }

    const distributions: Record<number, number[]> = {
      1: [100],
      2: [50, 50],
      3: [33.33, 33.33, 33.34],
    }

    return (
      distributions[numColumns] || new Array(numColumns).fill(100 / numColumns)
    )
  }

  private calculateColumnAlignments(
    numColumns: number,
    specified?: ('left' | 'center' | 'right')[],
  ): ('left' | 'center' | 'right')[] {
    if (specified && specified.length === numColumns) {
      return specified
    }

    const alignments: Record<number, ('left' | 'center' | 'right')[]> = {
      1: ['center'],
      2: ['left', 'right'],
      3: ['left', 'center', 'right'],
    }

    return alignments[numColumns] || new Array(numColumns).fill('left')
  }

  private async createThemedImageDetailed(
    content: {
      buffer: Buffer
      width?: number
      height?: number
      caption?: string
      captionPosition?: 'above' | 'below' | 'side'
      alignment?: string
    },
    theme: DocumentTheme,
  ): Promise<Paragraph | Table> {
    try {
      const imageRun = new ImageRun({
        data: content.buffer,
        transformation: {
          width: content.width || 400,
          height: content.height || 300,
        },
        type: 'png',
      })

      const captionRun = content.caption
        ? new TextRun({
            text: content.caption,
            italics: true,
            size: (theme.paragraph.fontSize - 1) * 2,
            color: theme.colors.text,
            font: theme.fonts.body,
          })
        : null

      const alignment = this.getAlignment(content.alignment || 'center')

      // párrafo que contiene sólo la imagen (útil cuando no hay caption)
      const imageParagraph = new Paragraph({
        alignment,
        spacing: { before: 120, after: 120 },
        children: [imageRun],
      })

      if (!captionRun) {
        // no hay caption -> devolvemos sólo la imagen
        return imageParagraph
      }

      // Si hay caption, construimos la respuesta según la posición pedida
      const captionParagraph = new Paragraph({
        alignment,
        spacing: { before: 0, after: 60 },
        children: [captionRun],
      })

      // Para separar líneas cuando ponemos caption + image en un mismo Paragraph
      const breakRun = new TextRun({ text: '', break: 1 })

      switch (content.captionPosition) {
        case 'above':
          // caption arriba, luego imagen (ambos en el mismo párrafo para mantener firma)
          return new Paragraph({
            alignment,
            spacing: { before: 120, after: 60 },
            children: [captionRun, breakRun, imageRun],
          })

        case 'below':
          // imagen y luego caption en la misma línea/ párrafo (separados con break)
          return new Paragraph({
            alignment,
            spacing: { before: 60, after: 120 },
            children: [imageRun, breakRun, captionRun],
          })

        case 'side':
          // lado a lado: tabla con 2 celdas. IMPORTANTE: las celdas reciben Paragraphs
          const leftCell = new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [imageRun] })],
          })
          const rightCell = new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [captionRun] })],
          })

          return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: [leftCell, rightCell] })],
            borders: {
              top: { style: BorderStyle.NONE, size: 0 },
              bottom: { style: BorderStyle.NONE, size: 0 },
              left: { style: BorderStyle.NONE, size: 0 },
              right: { style: BorderStyle.NONE, size: 0 },
              insideHorizontal: { style: BorderStyle.NONE, size: 0 },
              insideVertical: { style: BorderStyle.NONE, size: 0 },
            },
          })

        default:
          // comportamiento por defecto: caption debajo
          return new Paragraph({
            alignment,
            spacing: { before: 60, after: 120 },
            children: [imageRun, breakRun, captionRun],
          })
      }
    } catch (error) {
      this.logger.error('Error creando imagen:', error)
      return new Paragraph({
        children: [
          new TextRun({
            text: `[Error cargando imagen: ${
              error instanceof Error ? error.message : 'Error desconocido'
            }]`,
            color: theme.colors.error,
            italics: true,
            font: theme.fonts.body,
          }),
        ],
      })
    }
  }

  private createHtmlFallback(
    html: { html?: string; fallbackText?: string },
    theme: DocumentTheme,
  ): Paragraph {
    const text =
      html.html?.replace(/<[^>]*>/g, '').trim() || html.fallbackText || ''
    return this.createThemedParagraph({ text }, theme)
  }

  private createTableOfContents(config: DocumentConfig): TableOfContents {
    const tocConfig = config.tableOfContents || config.theme.tableOfContents

    return new TableOfContents('Tabla de Contenido', {
      hyperlink: true,
      headingStyleRange: `1-${tocConfig?.maxLevel || 3}`,
    })
  }

  private getHeadingLevel(
    level: number,
  ): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
    const levels: Record<
      number,
      (typeof HeadingLevel)[keyof typeof HeadingLevel]
    > = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3,
      4: HeadingLevel.HEADING_4,
      5: HeadingLevel.HEADING_5,
      6: HeadingLevel.HEADING_6,
    }

    return levels[level] ?? HeadingLevel.HEADING_1
  }

  private getAlignment(
    alignment: string,
  ): (typeof AlignmentType)[keyof typeof AlignmentType] {
    const alignments: Record<
      string,
      (typeof AlignmentType)[keyof typeof AlignmentType]
    > = {
      left: AlignmentType.LEFT,
      center: AlignmentType.CENTER,
      right: AlignmentType.RIGHT,
      justify: AlignmentType.JUSTIFIED,
    }

    return alignments[alignment] ?? AlignmentType.LEFT
  }
}

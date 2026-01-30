// theme.service.ts - Versión refactorizada sin any y métodos simplificados
import { Injectable } from '@nestjs/common'
import {
  DocumentTheme,
  HeadingContent,
  ParagraphContent,
  TableContent,
  ListContent,
  ListNumberFormat,
} from '../interfaces'
import { BUSINESS_THEME, MODERN_THEME, CREATIVE_THEME } from '../theme'

// Tipos específicos para configuraciones procesadas
interface ProcessedHeadingConfig {
  text: string
  level: number
  size: number
  color: string
  bold: boolean
  font: string
  spacing?: { before: number; after: number }
}

interface ProcessedParagraphConfig {
  fontSize: number
  color: string
  alignment: string
  spacing: { before: number; after: number }
  font: string
}

interface ProcessedTableConfig {
  headers: Array<{
    content: string
    backgroundColor: string
    alignment: string
  }>
  rows: Array<
    Array<{ content: string; backgroundColor: string; alignment: string }>
  >
  fontSize: number
  borders: boolean
  columnWidths?: number[]
}

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
  items: ListContent['items']
  type: string
  fontSize: number
  spacing: { before: number; after: number; between: number }
  indent: number
  color: string
  font: string
  maxNestingLevel: number
  style: Record<number, ListLevelConfig>
}

@Injectable()
export class ThemeManagerService {
  private themes: Map<string, DocumentTheme> = new Map()

  constructor() {
    this.loadDefaultThemes()
  }

  private loadDefaultThemes(): void {
    this.themes.set('business', BUSINESS_THEME)
    this.themes.set('modern', MODERN_THEME)
    this.themes.set('creative', CREATIVE_THEME)
  }

  getTheme(name: string): DocumentTheme {
    const theme = this.themes.get(name)
    if (!theme) {
      throw new Error(`Tema '${name}' no encontrado`)
    }
    return theme
  }

  registerTheme(name: string, theme: DocumentTheme): void {
    this.themes.set(name, theme)
  }

  listThemes(): string[] {
    return Array.from(this.themes.keys())
  }

  // SIMPLIFICADO: Aplicar tema a heading
  applyThemeToHeading(
    content: HeadingContent,
    theme: DocumentTheme,
  ): ProcessedHeadingConfig {
    const headingKey = `h${content.level}`
    const headingConfig = theme.headings[headingKey]

    return {
      text: content.text,
      level: content.level,
      size: headingConfig.size,
      color: headingConfig.color || theme.colors.primary,
      bold: headingConfig.bold ?? true,
      font: theme.fonts.heading || theme.fonts.body,
      spacing: headingConfig.spacing,
    }
  }

  // SIMPLIFICADO: Aplicar tema a párrafo
  applyThemeToParagraph(
    content: ParagraphContent,
    theme: DocumentTheme,
  ): ProcessedParagraphConfig {
    return {
      fontSize: theme.paragraph.fontSize,
      color: theme.colors.text,
      alignment: content.alignment || theme.paragraph.alignment,
      spacing: theme.paragraph.spacing,
      font: theme.fonts.body,
    }
  }

  // SIMPLIFICADO: Aplicar tema a tabla
  applyThemeToTable(
    content: TableContent,
    theme: DocumentTheme,
  ): ProcessedTableConfig {
    return {
      headers: content.headers.map((header) => ({
        content: header,
        backgroundColor: theme.table.headerBackground,
        alignment: 'center',
      })),
      rows: content.rows.map((row, index) =>
        row.map((cell) => ({
          content: cell,
          backgroundColor: theme.table.alternateRows
            ? index % 2 === 0
              ? theme.table.evenRowColor || theme.colors.background
              : theme.table.oddRowColor || theme.colors.background
            : theme.colors.background,
          alignment: 'left',
        })),
      ),
      fontSize: theme.table.fontSize,
      borders: true,
      columnWidths: content.columnWidths,
    }
  }

  // SIMPLIFICADO: Aplicar tema a lista
  applyThemeToList(
    content: ListContent,
    theme: DocumentTheme,
  ): ProcessedListConfig {
    const baseFontSize = theme.list.fontSize || theme.paragraph.fontSize
    const baseIndent = theme.list.indent || 360

    return {
      items: content.items,
      type: content.type,
      fontSize: baseFontSize,
      spacing: theme.list.spacing,
      indent: baseIndent,
      color: theme.colors.text,
      font: theme.fonts.body,
      maxNestingLevel: content.maxNestingLevel || 3,
      style: this.buildListLevelStyles(
        content,
        theme,
        baseFontSize,
        baseIndent,
      ),
    }
  }

  // SIMPLIFICADO: Construir estilos por nivel de lista
  private buildListLevelStyles(
    content: ListContent,
    theme: DocumentTheme,
    baseFontSize: number,
    baseIndent: number,
  ): Record<number, ListLevelConfig> {
    const styles: Record<number, ListLevelConfig> = {}

    for (let level = 0; level < 3; level++) {
      const customStyle = content.style?.[level]
      const defaultConfig = this.getDefaultLevelConfig(
        level,
        content.type,
        theme,
      )

      styles[level] = {
        symbol: customStyle?.symbol || defaultConfig.symbol,
        format: customStyle?.format || defaultConfig.format,
        color: customStyle?.color || defaultConfig.color || theme.colors.text,
        fontSize: customStyle?.fontSize || baseFontSize,
        indent: customStyle?.indent || baseIndent + level * 360,
        bold: customStyle?.bold || false,
        italic: customStyle?.italic || false,
      }
    }

    return styles
  }

  // SIMPLIFICADO: Configuración por defecto según tipo y nivel
  private getDefaultLevelConfig(
    level: number,
    type: string,
    theme: DocumentTheme,
  ): Partial<ListLevelConfig> {
    const configs: Record<string, Array<Partial<ListLevelConfig>>> = {
      bullet: [
        { symbol: '•', color: theme.colors.primary },
        { symbol: '◦', color: theme.colors.secondary },
        { symbol: '▪', color: theme.colors.accent },
      ],
      numbered: [
        { format: 'decimal', color: theme.colors.primary },
        { format: 'lowerLetter', color: theme.colors.secondary },
        { format: 'lowerRoman', color: theme.colors.accent },
      ],
      checklist: [
        { symbol: '☐', color: theme.colors.primary },
        { symbol: '☑', color: theme.colors.secondary },
        { symbol: '✓', color: theme.colors.accent },
      ],
      arrow: [
        { symbol: '→', color: theme.colors.primary },
        { symbol: '⇒', color: theme.colors.secondary },
        { symbol: '▶', color: theme.colors.accent },
      ],
      custom: [
        {
          symbol: theme.list.bullet.symbol || '•',
          color: theme.colors.primary,
        },
        { symbol: '◦', color: theme.colors.secondary },
        { symbol: '▪', color: theme.colors.accent },
      ],
    }

    const typeConfigs = configs[type] || configs.bullet
    return typeConfigs[level] || typeConfigs[0]
  }

  // NUEVO: Método específico para aplicar overrides a una lista
  applyListOverrides(
    baseConfig: ProcessedListConfig,
    overrides: Partial<DocumentTheme['list']>,
    customStyles?: ListContent['style'],
  ): ProcessedListConfig {
    const result = { ...baseConfig }

    // Aplicar overrides del tema
    if (overrides.fontSize !== undefined) {
      result.fontSize = overrides.fontSize
    }
    if (overrides.spacing) {
      result.spacing = { ...result.spacing, ...overrides.spacing }
    }
    if (overrides.indent !== undefined) {
      result.indent = overrides.indent
    }

    // Actualizar configuración de bullets/números por defecto si no hay custom
    if (overrides.bullet) {
      Object.keys(result.style).forEach((levelStr) => {
        const level = parseInt(levelStr)
        const levelConfig = result.style[level]
        if (levelConfig && !customStyles?.[level]?.symbol) {
          levelConfig.symbol = overrides.bullet!.symbol
          if (overrides.bullet!.color) {
            levelConfig.color = overrides.bullet!.color
          }
        }
      })
    }

    if (overrides.numbered) {
      Object.keys(result.style).forEach((levelStr) => {
        const level = parseInt(levelStr)
        const levelConfig = result.style[level]
        if (levelConfig && !customStyles?.[level]?.format) {
          levelConfig.format = overrides.numbered!.format
          if (overrides.numbered!.color) {
            levelConfig.color = overrides.numbered!.color
          }
        }
      })
    }

    // Aplicar estilos custom específicos (máxima prioridad)
    if (customStyles) {
      Object.entries(customStyles).forEach(([levelStr, style]) => {
        const level = parseInt(levelStr)
        const levelConfig = result.style[level]
        if (levelConfig && style) {
          Object.assign(levelConfig, style)
        }
      })
    }

    return result
  }

  // SIMPLIFICADO: Crear tema personalizado
  createCustomTheme(
    baseName: string,
    overrides: Partial<DocumentTheme>,
  ): DocumentTheme {
    const baseTheme = this.getTheme(baseName)

    return {
      ...baseTheme,
      ...overrides,
      name: overrides.name || `${baseName}_custom`,
      colors: { ...baseTheme.colors, ...(overrides.colors || {}) },
      fonts: { ...baseTheme.fonts, ...(overrides.fonts || {}) },
      headings: { ...baseTheme.headings, ...(overrides.headings || {}) },
      paragraph: { ...baseTheme.paragraph, ...(overrides.paragraph || {}) },
      table: { ...baseTheme.table, ...(overrides.table || {}) },
      list: {
        ...baseTheme.list,
        ...(overrides.list || {}),
        fontSize:
          overrides.list?.fontSize ||
          baseTheme.list?.fontSize ||
          baseTheme.paragraph.fontSize,
      },
      header: this.mergeHeaderFooterConfig(baseTheme.header, overrides.header),
      footer: this.mergeHeaderFooterConfig(baseTheme.footer, overrides.footer),
      tableOfContents: this.mergeTOCConfig(
        baseTheme.tableOfContents,
        overrides.tableOfContents,
      ),
    }
  }

  private mergeHeaderFooterConfig(
    base?: DocumentTheme['header'],
    override?: Partial<DocumentTheme['header']>,
  ): DocumentTheme['header'] {
    if (!override && !base) return undefined

    return {
      fontSize: override?.fontSize ?? base?.fontSize ?? 10,
      color: override?.color ?? base?.color ?? '000000',
      alignment: override?.alignment ?? base?.alignment ?? 'center',
      borderBottom: override?.borderBottom ?? base?.borderBottom,
      borderTop: override?.borderTop ?? base?.borderTop,
    }
  }

  private mergeTOCConfig(
    base?: DocumentTheme['tableOfContents'],
    override?: Partial<DocumentTheme['tableOfContents']>,
  ): DocumentTheme['tableOfContents'] {
    if (!override && !base) return undefined

    return {
      title: override?.title ?? base?.title ?? 'Tabla de Contenido',
      fontSize: override?.fontSize ?? base?.fontSize ?? 12,
      color: override?.color ?? base?.color ?? '000000',
      includePageNumbers:
        override?.includePageNumbers ?? base?.includePageNumbers ?? false,
      maxLevel: override?.maxLevel ?? base?.maxLevel ?? 3,
    }
  }

  // SIMPLIFICADO: Validación de tema
  validateTheme(theme: DocumentTheme): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validar colores
    this.validateColors(theme.colors, errors)

    // Validar tamaños de fuente
    this.validateFontSizes(theme, errors)

    // Validar configuraciones específicas
    this.validateListConfig(theme.list, theme.paragraph.fontSize, errors)

    return { valid: errors.length === 0, errors }
  }

  private validateColors(
    colors: DocumentTheme['colors'],
    errors: string[],
  ): void {
    const colorRegex = /^[0-9A-Fa-f]{6}$/
    Object.entries(colors).forEach(([key, value]) => {
      if (!colorRegex.test(value)) {
        errors.push(
          `Color '${key}' debe ser un valor hexadecimal válido (sin #)`,
        )
      }
    })
  }

  private validateFontSizes(theme: DocumentTheme, errors: string[]): void {
    // Validar headings
    Object.entries(theme.headings).forEach(([level, config]) => {
      if (
        !config ||
        typeof config.size !== 'number' ||
        config.size <= 0 ||
        config.size > 72
      ) {
        errors.push(`Tamaño de fuente para ${level} debe estar entre 1 y 72pt`)
      }
    })

    // Validar párrafo
    if (
      !theme.paragraph ||
      theme.paragraph.fontSize <= 0 ||
      theme.paragraph.fontSize > 72
    ) {
      errors.push('Tamaño de fuente del párrafo debe estar entre 1 y 72pt')
    }

    // Validar tabla
    if (
      !theme.table ||
      theme.table.fontSize <= 0 ||
      theme.table.fontSize > 72
    ) {
      errors.push('Tamaño de fuente de la tabla debe estar entre 1 y 72pt')
    }
  }

  private validateListConfig(
    list: DocumentTheme['list'] | undefined,
    paragraphFontSize: number,
    errors: string[],
  ): void {
    const listFontSize = list?.fontSize || paragraphFontSize
    if (listFontSize <= 0 || listFontSize > 72) {
      errors.push('Tamaño de fuente de la lista debe estar entre 1 y 72pt')
    }

    if (list && typeof list.indent === 'number' && list.indent < 0) {
      errors.push('La indentación de la lista no puede ser negativa')
    }
  }

  // SIMPLIFICADO: Crear variación de tema
  createThemeVariation(
    baseName: string,
    name: string,
    modifications: {
      colorScheme?: Partial<DocumentTheme['colors']>
      fontSize?: number
      spacing?: number
    },
  ): DocumentTheme {
    const baseTheme = this.getTheme(baseName)
    const theme: DocumentTheme = { ...baseTheme, name }

    if (modifications.colorScheme) {
      theme.colors = { ...theme.colors, ...modifications.colorScheme }
    }

    if (modifications.fontSize && modifications.fontSize > 0) {
      this.applyFontSizeMultiplier(theme, modifications.fontSize)
    }

    if (modifications.spacing && modifications.spacing > 0) {
      this.applySpacingMultiplier(theme, modifications.spacing)
    }

    return theme
  }

  private applyFontSizeMultiplier(theme: DocumentTheme, factor: number): void {
    // Actualizar headings
    Object.keys(theme.headings).forEach((level) => {
      const headingKey = level as keyof typeof theme.headings
      const currentConfig = theme.headings[headingKey]
      if (currentConfig && typeof currentConfig.size === 'number') {
        currentConfig.size = Math.max(
          1,
          Math.round(currentConfig.size * factor),
        )
      }
    })

    // Actualizar otros tamaños
    theme.paragraph.fontSize = Math.max(
      1,
      Math.round(theme.paragraph.fontSize * factor),
    )
    theme.table.fontSize = Math.max(
      1,
      Math.round(theme.table.fontSize * factor),
    )

    if (theme.list) {
      theme.list.fontSize = Math.max(
        1,
        Math.round((theme.list.fontSize || theme.paragraph.fontSize) * factor),
      )
    }
  }

  private applySpacingMultiplier(theme: DocumentTheme, factor: number): void {
    // Actualizar spacing de headings
    Object.keys(theme.headings).forEach((level) => {
      const headingKey = level as keyof typeof theme.headings
      const currentConfig = theme.headings[headingKey]
      if (currentConfig?.spacing) {
        currentConfig.spacing = {
          before: Math.round(currentConfig.spacing.before * factor),
          after: Math.round(currentConfig.spacing.after * factor),
        }
      }
    })

    // Actualizar spacing de párrafos
    theme.paragraph.spacing = {
      before: Math.round(theme.paragraph.spacing.before * factor),
      after: Math.round(theme.paragraph.spacing.after * factor),
    }

    // Actualizar spacing de listas
    if (theme.list?.spacing) {
      theme.list.spacing = {
        before: Math.round(theme.list.spacing.before * factor),
        after: Math.round(theme.list.spacing.after * factor),
        between: Math.round(theme.list.spacing.between * factor),
      }
    }
  }
}

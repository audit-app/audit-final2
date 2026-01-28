// html-to-sections-converter.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { JSDOM } from 'jsdom'
import {
  DocumentSection,
  HeadingSection,
  ParagraphSection,
  ListSection,
  TableSection,
  createHeadingSection,
  createParagraphSection,
  createListSection,
  createTableSection,
  createStyledParagraph,
  StyledText,
  ListItem,
  InlineTextStyle,
} from '../interfaces'

@Injectable()
export class HtmlToSectionsConverterService {
  private readonly logger = new Logger(HtmlToSectionsConverterService.name)

  /**
   * Convierte HTML a un array de DocumentSection[]
   * Esto permite reutilizar toda la lógica del builder
   */
  convertHtmlToSections(html: string): DocumentSection[] {
    try {
      const dom = new JSDOM(html)
      const document = dom.window.document
      const body = document.body

      const sections: DocumentSection[] = []

      // Procesar todos los nodos hijos del body
      for (const node of Array.from(body.childNodes)) {
        const convertedSections = this.convertNodeToSections(node)
        sections.push(...convertedSections)
      }

      return sections.filter((section) => section !== null)
    } catch (error) {
      this.logger.error('Error convirtiendo HTML a secciones:', error)
      // Fallback: crear una sección de párrafo con el texto plano
      return [createParagraphSection(this.extractTextFromHtml(html))]
    }
  }

  private convertNodeToSections(node: Node): DocumentSection[] {
    if (node.nodeType === node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (!text) return []

      return [createParagraphSection(text)]
    }

    if (node.nodeType !== node.ELEMENT_NODE) {
      return []
    }

    const element = node as Element
    const tagName = element.tagName.toLowerCase()

    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return this.convertHeadingToSection(element)

      case 'p':
        return this.convertParagraphToSection(element)

      case 'ul':
      case 'ol':
        return this.convertListToSection(element)

      case 'table':
        return this.convertTableToSection(element)

      case 'div':
      case 'section':
      case 'article':
        return this.convertContainerToSections(element)

      case 'br':
        return [createParagraphSection('')] // Línea vacía

      case 'hr':
        return [{ type: 'spacer', content: { height: 240 } }]

      // Elementos inline se procesan en el contexto de su párrafo padre
      case 'span':
      case 'strong':
      case 'b':
      case 'em':
      case 'i':
      case 'u':
      case 'strike':
      case 'del':
      case 'sup':
      case 'sub':
        // Si llegan aquí es porque no están dentro de un párrafo
        return [this.convertInlineElementToParagraph(element)]

      default:
        // Para elementos no reconocidos, extraer su contenido como párrafo
        const text = element.textContent?.trim()
        return text ? [createParagraphSection(text)] : []
    }
  }

  private convertHeadingToSection(element: Element): DocumentSection[] {
    const level = parseInt(element.tagName.charAt(1)) as 1 | 2 | 3 | 4 | 5 | 6
    const text = element.textContent?.trim() || ''

    return [createHeadingSection(text, level)]
  }

  private convertParagraphToSection(element: Element): DocumentSection[] {
    // Verificar si el párrafo contiene solo texto plano
    if (this.isPlainTextParagraph(element)) {
      const text = element.textContent?.trim() || ''
      return text ? [createParagraphSection(text)] : []
    }

    // El párrafo tiene elementos inline con estilos
    const styledText = this.extractStyledTextFromElement(element)

    if (styledText.length === 0) {
      return []
    }

    return [createStyledParagraph(styledText)]
  }

  private convertListToSection(element: Element): DocumentSection[] {
    const isOrdered = element.tagName.toLowerCase() === 'ol'
    const listType = isOrdered ? 'numbered' : 'bullet'

    const items = this.extractListItems(element)

    if (items.length === 0) {
      return []
    }

    const adaptedItems = items.map((item) => ({
      text: item.text,
      subItems: item.subItems
        ? item.subItems.map((sub) => sub.text)
        : undefined,
    }))
    return [createListSection(adaptedItems, listType)]
  }

  private convertTableToSection(element: Element): DocumentSection[] {
    const { headers, rows } = this.extractTableData(element)

    if (headers.length === 0 && rows.length === 0) {
      return []
    }

    // Si no hay headers, usar la primera fila como headers
    const finalHeaders = headers.length > 0 ? headers : rows.shift() || []

    return [createTableSection(finalHeaders, rows)]
  }

  private convertContainerToSections(element: Element): DocumentSection[] {
    const sections: DocumentSection[] = []

    for (const child of Array.from(element.childNodes)) {
      const childSections = this.convertNodeToSections(child)
      sections.push(...childSections)
    }

    return sections
  }

  private convertInlineElementToParagraph(element: Element): ParagraphSection {
    const styledText = this.extractStyledTextFromElement(element)
    return createStyledParagraph(styledText)
  }

  // === EXTRACCIÓN DE CONTENIDO ===

  private extractStyledTextFromElement(element: Element): StyledText[] {
    const result: StyledText[] = []

    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === node.TEXT_NODE) {
        const text = node.textContent || ''
        if (text.trim()) {
          result.push({ text })
        }
      } else if (node.nodeType === node.ELEMENT_NODE) {
        const childElement = node as Element
        const styledTexts = this.convertInlineElementToStyledText(childElement)
        result.push(...styledTexts)
      }
    }

    return result
  }

  private convertInlineElementToStyledText(element: Element): StyledText[] {
    const tagName = element.tagName.toLowerCase()
    const text = element.textContent?.trim() || ''

    if (!text) return []

    const style: InlineTextStyle = {}

    // Aplicar estilos según el tag
    switch (tagName) {
      case 'strong':
      case 'b':
        style.bold = true
        break
      case 'em':
      case 'i':
        style.italic = true
        break
      case 'u':
        style.underline = true
        break
      case 'strike':
      case 'del':
        style.strikethrough = true
        break
      case 'sup':
        style.superscript = true
        break
      case 'sub':
        style.subscript = true
        break
      case 'span':
        // Para span, extraer estilos del atributo style
        this.extractInlineStyles(element, style)
        break
    }

    // Extraer estilos CSS inline de cualquier elemento
    this.extractInlineStyles(element, style)

    // Si el elemento tiene hijos inline, procesarlos recursivamente
    if (this.hasInlineChildren(element)) {
      const result: StyledText[] = []

      for (const child of Array.from(element.childNodes)) {
        if (child.nodeType === child.TEXT_NODE) {
          const childText = child.textContent || ''
          if (childText.trim()) {
            result.push({ text: childText, style: { ...style } })
          }
        } else if (child.nodeType === child.ELEMENT_NODE) {
          const childElement = child as Element
          const childStyledTexts =
            this.convertInlineElementToStyledText(childElement)
          // Combinar estilos padre + hijo
          result.push(
            ...childStyledTexts.map((st) => ({
              text: st.text,
              style: { ...style, ...st.style },
            })),
          )
        }
      }

      return result
    }

    return [{ text, style: Object.keys(style).length > 0 ? style : undefined }]
  }

  private extractListItems(listElement: Element): ListItem[] {
    const items: ListItem[] = []

    const listItems = listElement.querySelectorAll(':scope > li')

    for (const li of Array.from(listItems)) {
      const item = this.convertListItemToListItem(li)
      if (item) {
        items.push(item)
      }
    }

    return items
  }

  private convertListItemToListItem(li: Element): ListItem | null {
    // Extraer texto directo del li (sin incluir sublistas)
    let text = ''
    const subItems: ListItem[] = []

    for (const child of Array.from(li.childNodes)) {
      if (child.nodeType === child.TEXT_NODE) {
        text += child.textContent || ''
      } else if (child.nodeType === child.ELEMENT_NODE) {
        const childElement = child as Element

        if (
          childElement.tagName.toLowerCase() === 'ul' ||
          childElement.tagName.toLowerCase() === 'ol'
        ) {
          // Es una sublista
          const childItems = this.extractListItems(childElement)
          subItems.push(...childItems)
        } else {
          // Es otro elemento inline, extraer su texto
          text += childElement.textContent || ''
        }
      }
    }

    text = text.trim()

    if (!text && subItems.length === 0) {
      return null
    }

    return {
      text: text || '',
      subItems: subItems.length > 0 ? subItems : undefined,
    }
  }

  private extractTableData(table: Element): {
    headers: string[]
    rows: string[][]
  } {
    const headers: string[] = []
    const rows: string[][] = []

    // Buscar thead y extraer headers
    const thead = table.querySelector('thead')
    if (thead) {
      const headerRow = thead.querySelector('tr')
      if (headerRow) {
        const headerCells = headerRow.querySelectorAll('th, td')
        for (const cell of Array.from(headerCells)) {
          headers.push(cell.textContent?.trim() || '')
        }
      }
    }

    // Buscar tbody o usar el table directamente para las filas
    const tbody = table.querySelector('tbody') || table
    const tableRows = tbody.querySelectorAll('tr')

    for (const row of Array.from(tableRows)) {
      // Si estamos en thead, saltar esta fila
      if (thead && thead.contains(row)) {
        continue
      }

      const cells = row.querySelectorAll('td, th')
      const rowData: string[] = []

      for (const cell of Array.from(cells)) {
        rowData.push(cell.textContent?.trim() || '')
      }

      if (rowData.length > 0) {
        rows.push(rowData)
      }
    }

    return { headers, rows }
  }

  // === UTILIDADES ===

  private isPlainTextParagraph(element: Element): boolean {
    // Verificar si solo contiene texto o elementos que no afectan el estilo
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === child.ELEMENT_NODE) {
        const childElement = child as Element
        const tagName = childElement.tagName.toLowerCase()

        // Si contiene elementos que requieren estilo, no es texto plano
        if (
          [
            'strong',
            'b',
            'em',
            'i',
            'u',
            'span',
            'strike',
            'del',
            'sup',
            'sub',
          ].includes(tagName)
        ) {
          return false
        }
      }
    }

    return true
  }

  private hasInlineChildren(element: Element): boolean {
    return Array.from(element.children).some((child) => {
      const tagName = child.tagName.toLowerCase()
      return [
        'strong',
        'b',
        'em',
        'i',
        'u',
        'span',
        'strike',
        'del',
        'sup',
        'sub',
      ].includes(tagName)
    })
  }

  private extractInlineStyles(element: Element, style: InlineTextStyle): void {
    const styleAttr = element.getAttribute('style')
    if (!styleAttr) return

    const styles = styleAttr.split(';').reduce(
      (acc, style) => {
        const [property, value] = style.split(':').map((s) => s.trim())
        if (property && value) {
          acc[property] = value
        }
        return acc
      },
      {} as Record<string, string>,
    )

    // Mapear propiedades CSS a nuestros estilos
    if (styles.color) {
      style.color = this.convertCssColorToHex(styles.color)
    }

    if (styles['background-color']) {
      style.backgroundColor = this.convertCssColorToHex(
        styles['background-color'],
      )
    }

    if (
      styles['font-weight'] === 'bold' ||
      parseInt(styles['font-weight']) >= 600
    ) {
      style.bold = true
    }

    if (styles['font-style'] === 'italic') {
      style.italic = true
    }

    if (styles['text-decoration']?.includes('underline')) {
      style.underline = true
    }

    if (styles['text-decoration']?.includes('line-through')) {
      style.strikethrough = true
    }

    if (styles['font-size']) {
      const fontSize = this.convertCssFontSizeToPoints(styles['font-size'])
      if (fontSize) {
        style.fontSize = fontSize
      }
    }

    if (styles['font-family']) {
      style.font = styles['font-family']
        .replace(/['"]/g, '')
        .split(',')[0]
        .trim()
    }
  }

  private convertCssColorToHex(cssColor: string): string {
    // Remover espacios y convertir a lowercase
    cssColor = cssColor.trim().toLowerCase()

    // Si ya es hex, remover el #
    if (cssColor.startsWith('#')) {
      return cssColor.substring(1)
    }

    // Colores CSS comunes a hex
    const colorMap: Record<string, string> = {
      black: '000000',
      white: 'FFFFFF',
      red: 'FF0000',
      green: '008000',
      blue: '0000FF',
      yellow: 'FFFF00',
      orange: 'FFA500',
      purple: '800080',
      gray: '808080',
      grey: '808080',
    }

    if (colorMap[cssColor]) {
      return colorMap[cssColor]
    }

    // Procesar rgb() y rgba()
    const rgbMatch = cssColor.match(
      /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/,
    )
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0')
      const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0')
      const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0')
      return `${r}${g}${b}`.toUpperCase()
    }

    // Fallback: devolver negro
    return '000000'
  }

  private convertCssFontSizeToPoints(cssSize: string): number | undefined {
    cssSize = cssSize.trim().toLowerCase()

    // Remover unidades y convertir
    if (cssSize.endsWith('px')) {
      const px = parseFloat(cssSize)
      return Math.round(px * 0.75) // 1px ≈ 0.75pt
    }

    if (cssSize.endsWith('pt')) {
      return parseFloat(cssSize)
    }

    if (cssSize.endsWith('em')) {
      const em = parseFloat(cssSize)
      return Math.round(em * 12) // Asumir 12pt base
    }

    // Tamaños CSS comunes
    const sizeMap: Record<string, number> = {
      'xx-small': 7,
      'x-small': 8,
      small: 10,
      medium: 12,
      large: 14,
      'x-large': 18,
      'xx-large': 24,
    }

    return sizeMap[cssSize]
  }

  private extractTextFromHtml(html: string): string {
    try {
      const dom = new JSDOM(html)
      return dom.window.document.body.textContent?.trim() || ''
    } catch {
      return html.replace(/<[^>]*>/g, '').trim()
    }
  }
}

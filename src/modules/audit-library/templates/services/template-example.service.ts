import { Injectable, Logger } from '@nestjs/common'
import * as ExcelJS from 'exceljs'

/**
 * Template Example Service
 *
 * Genera un archivo Excel de ejemplo/plantilla que muestra la estructura
 * correcta para importar templates. Los usuarios pueden descargar este archivo,
 * ver la estructura esperada, y luego crear sus propias plantillas siguiendo
 * el mismo formato.
 *
 * El archivo generado incluye:
 * - Hoja "Template": Metadatos de ejemplo de la plantilla
 * - Hoja "Standards": Ejemplos de controles con la estructura correcta
 * - Comentarios en celdas para guiar al usuario
 * - Formato profesional con colores y bordes
 */
@Injectable()
export class TemplateExampleService {
  private readonly logger = new Logger(TemplateExampleService.name)

  /**
   * Genera un archivo Excel de ejemplo para importación de templates
   *
   * @returns Buffer del archivo Excel generado
   */
  async generateExampleFile(): Promise<Buffer> {
    this.logger.log('Generando archivo Excel de ejemplo para templates')

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Audit Core'
    workbook.created = new Date()
    workbook.company = 'Audit Core System'

    // Crear hojas
    this.createTemplateSheet(workbook)
    this.createStandardsSheet(workbook)
    this.createInstructionsSheet(workbook)

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer()

    this.logger.log('Archivo Excel de ejemplo generado exitosamente')

    return Buffer.from(buffer)
  }

  /**
   * Crea la hoja "Template" con metadatos de ejemplo
   */
  private createTemplateSheet(workbook: ExcelJS.Workbook): void {
    const sheet = workbook.addWorksheet('Template')

    // Configurar columnas
    sheet.columns = [
      { header: 'Campo', key: 'field', width: 25 },
      { header: 'Valor', key: 'value', width: 60 },
      { header: 'Descripción', key: 'description', width: 40 },
    ]

    // Estilo del header
    sheet.getRow(1).font = { bold: true, size: 12 }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }, // Azul
    }
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // Datos de ejemplo
    const templateData = [
      {
        field: 'name',
        value: 'ISO 27001:2022',
        description: 'Nombre de la plantilla (obligatorio)',
      },
      {
        field: 'version',
        value: '1.0',
        description: 'Versión de la plantilla (obligatorio)',
      },
      {
        field: 'code',
        value: 'ISO27001',
        description: 'Código único de la plantilla (opcional)',
      },
      {
        field: 'description',
        value:
          'Plantilla de controles ISO 27001:2022 para auditorías de seguridad de la información',
        description: 'Descripción detallada de la plantilla (opcional)',
      },
    ]

    sheet.addRows(templateData)

    // Aplicar bordes
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }

        // Resaltar campos obligatorios
        if (rowNumber > 1 && rowNumber <= 3) {
          row.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE699' }, // Amarillo claro
          }
        }
      })
    })

    // Nota informativa
    sheet.getCell('A7').value =
      'NOTA: Los metadatos de la plantilla también se pueden proporcionar al momento de subir el archivo.'
    sheet.getCell('A7').font = { italic: true, size: 10 }
    sheet.mergeCells('A7:C7')
  }

  /**
   * Crea la hoja "Standards" con ejemplos de controles
   */
  private createStandardsSheet(workbook: ExcelJS.Workbook): void {
    const sheet = workbook.addWorksheet('Standards')

    // Configurar columnas
    sheet.columns = [
      { header: 'Código', key: 'code', width: 15 },
      { header: 'Título', key: 'title', width: 80 },
      { header: 'Descripción', key: 'description', width: 60 },
      { header: 'Código Padre', key: 'parentCode', width: 15 },
      { header: 'Orden', key: 'order', width: 10 },
      { header: 'Nivel', key: 'level', width: 10 },
      { header: 'Auditable', key: 'isAuditable', width: 15 },
      { header: 'Peso (%)', key: 'weight', width: 12 },
      { header: 'Guía Auditor', key: 'auditorGuidance', width: 60 },
    ]

    // Estilo del header
    sheet.getRow(1).font = { bold: true, size: 12 }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }, // Verde
    }
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // Datos de ejemplo (estructura jerárquica)
    const exampleStandards = [
      // Nivel 1: Dominios principales
      {
        code: 'A.5',
        title: 'Políticas de Seguridad de la Información',
        description:
          'Proporcionar dirección y apoyo de la gestión para la seguridad de la información',
        parentCode: '',
        order: 1,
        level: 1,
        isAuditable: 'No',
        weight: 0,
        auditorGuidance: '',
      },
      {
        code: 'A.6',
        title: 'Organización de la Seguridad de la Información',
        description:
          'Establecer un marco de gestión para iniciar y controlar la implementación',
        parentCode: '',
        order: 2,
        level: 1,
        isAuditable: 'No',
        weight: 0,
        auditorGuidance: '',
      },
      {
        code: 'A.7',
        title: 'Seguridad de los Recursos Humanos',
        description:
          'Asegurar que los empleados entiendan sus responsabilidades',
        parentCode: '',
        order: 3,
        level: 1,
        isAuditable: 'No',
        weight: 0,
        auditorGuidance: '',
      },

      // Nivel 2: Objetivos de control (hijos de A.5)
      {
        code: 'A.5.1',
        title: 'Directrices de la Dirección para la Seguridad',
        description: 'Proporcionar dirección de la gestión',
        parentCode: 'A.5',
        order: 1,
        level: 2,
        isAuditable: 'No',
        weight: 0,
        auditorGuidance: '',
      },

      // Nivel 3: Controles específicos (hijos de A.5.1)
      {
        code: 'A.5.1.1',
        title:
          'Políticas para la seguridad de la información - Conjunto de políticas',
        description:
          'Se debe definir, aprobar, comunicar y reconocer un conjunto de políticas',
        parentCode: 'A.5.1',
        order: 1,
        level: 3,
        isAuditable: 'Sí',
        weight: 15,
        auditorGuidance:
          'Verificar existencia de políticas documentadas y aprobadas por gerencia. Revisar fecha de última actualización (debe ser < 1 año). Confirmar que están comunicadas a todo el personal.',
      },
      {
        code: 'A.5.1.2',
        title: 'Revisión de las políticas para la seguridad',
        description:
          'Las políticas deben ser revisadas a intervalos planificados',
        parentCode: 'A.5.1',
        order: 2,
        level: 3,
        isAuditable: 'Sí',
        weight: 10,
        auditorGuidance:
          'Revisar calendario de revisiones. Verificar actas de revisión de políticas en los últimos 12 meses. Validar aprobación de cambios.',
      },

      // Más controles de nivel 2 y 3 (hijos de A.6)
      {
        code: 'A.6.1',
        title: 'Organización Interna',
        description:
          'Establecer un marco de gestión para la seguridad de la información',
        parentCode: 'A.6',
        order: 1,
        level: 2,
        isAuditable: 'No',
        weight: 0,
        auditorGuidance: '',
      },
      {
        code: 'A.6.1.1',
        title: 'Roles y responsabilidades de seguridad',
        description:
          'Se deben definir y asignar todas las responsabilidades de seguridad',
        parentCode: 'A.6.1',
        order: 1,
        level: 3,
        isAuditable: 'Sí',
        weight: 20,
        auditorGuidance:
          'Revisar documentos de roles y responsabilidades. Entrevistar a responsables de seguridad. Verificar que están claramente documentados y comunicados.',
      },
      {
        code: 'A.6.1.2',
        title: 'Segregación de funciones',
        description:
          'Los deberes y áreas de responsabilidad conflictivos deben segregarse',
        parentCode: 'A.6.1',
        order: 2,
        level: 3,
        isAuditable: 'Sí',
        weight: 15,
        auditorGuidance:
          'Identificar funciones críticas. Verificar que no existen conflictos de interés. Revisar matriz de segregación de funciones.',
      },

      // Controles de A.7
      {
        code: 'A.7.1',
        title: 'Antes de la contratación',
        description:
          'Asegurar que empleados y contratistas entiendan sus responsabilidades',
        parentCode: 'A.7',
        order: 1,
        level: 2,
        isAuditable: 'No',
        weight: 0,
        auditorGuidance: '',
      },
      {
        code: 'A.7.1.1',
        title: 'Selección',
        description:
          'Las verificaciones de antecedentes deben realizarse según leyes relevantes',
        parentCode: 'A.7.1',
        order: 1,
        level: 3,
        isAuditable: 'Sí',
        weight: 25,
        auditorGuidance:
          'Revisar proceso de verificación de antecedentes. Seleccionar muestra de 5 contrataciones recientes. Verificar documentación de background checks conforme a normativa vigente.',
      },
      {
        code: 'A.7.1.2',
        title: 'Términos y condiciones de contratación',
        description:
          'Los acuerdos contractuales deben establecer responsabilidades',
        parentCode: 'A.7.1',
        order: 2,
        level: 3,
        isAuditable: 'Sí',
        weight: 15,
        auditorGuidance:
          'Revisar contratos laborales. Verificar que incluyan cláusulas de confidencialidad, acuerdos de uso aceptable, y responsabilidades de seguridad.',
      },
    ]

    sheet.addRows(exampleStandards)

    // Aplicar formato condicional por nivel
    exampleStandards.forEach((standard, index) => {
      const rowNumber = index + 2 // +2 porque la fila 1 es header
      const row = sheet.getRow(rowNumber)

      // Nivel 1: Verde claro, negrita
      if (standard.level === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE7F3E7' },
        }
        row.font = { bold: true }
      }
      // Nivel 2: Azul claro
      else if (standard.level === 2) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F8FF' },
        }
      }
      // Nivel 3: Sin color (blanco)

      // Aplicar bordes
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      })
    })

    // Agregar comentarios informativos a las celdas del header
    this.addCellComment(
      sheet,
      'A1',
      'Código único del control (ej: A.5, A.5.1, A.5.1.1). Obligatorio.',
    )
    this.addCellComment(
      sheet,
      'B1',
      'Título descriptivo del control. Obligatorio.',
    )
    this.addCellComment(
      sheet,
      'C1',
      'Descripción detallada del control. Opcional.',
    )
    this.addCellComment(
      sheet,
      'D1',
      'Código del control padre para crear jerarquía (ej: A.5.1.1 tiene padre A.5.1). Dejar vacío para controles de nivel 1.',
    )
    this.addCellComment(sheet, 'E1', 'Orden de visualización. Opcional.')
    this.addCellComment(
      sheet,
      'F1',
      'Nivel jerárquico (1, 2, 3, etc.). Obligatorio.',
    )
    this.addCellComment(
      sheet,
      'G1',
      'Indica si el control puede ser auditado. Valores: Sí, No, Yes, No, True, False.',
    )
    this.addCellComment(
      sheet,
      'H1',
      'Peso/ponderación del control (0-100). Solo aplica a controles auditables. La suma total debe ser 100. Opcional.',
    )
    this.addCellComment(
      sheet,
      'I1',
      'Guía o recomendaciones para el auditor. Describe qué debe revisar, verificar o evaluar. Puede estar en cualquier nivel. Opcional.',
    )

    // Nota informativa al final
    const lastRow = sheet.lastRow!.number + 2
    sheet.getCell(`A${lastRow}`).value =
      '💡 IMPORTANTE: Puede agregar más filas siguiendo esta estructura. El sistema acepta nombres de columnas en español e inglés. La suma de pesos de controles auditables debe ser 100.'
    sheet.getCell(`A${lastRow}`).font = { italic: true, size: 10, bold: true }
    sheet.mergeCells(`A${lastRow}:I${lastRow}`)
  }

  /**
   * Crea la hoja "Instrucciones" con guía de uso
   */
  private createInstructionsSheet(workbook: ExcelJS.Workbook): void {
    const sheet = workbook.addWorksheet('Instrucciones')

    sheet.columns = [
      { header: 'Paso', key: 'step', width: 10 },
      { header: 'Instrucción', key: 'instruction', width: 100 },
    ]

    // Estilo del header
    sheet.getRow(1).font = { bold: true, size: 12 }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF6B6B' }, // Rojo claro
    }
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    const instructions = [
      {
        step: '1',
        instruction:
          'Descargue este archivo como plantilla de ejemplo. Puede eliminarlo después de revisar la estructura.',
      },
      {
        step: '2',
        instruction:
          'La hoja "Template" contiene metadatos opcionales. Estos campos también se pueden proporcionar al subir el archivo.',
      },
      {
        step: '3',
        instruction:
          'La hoja "Standards" es OBLIGATORIA y debe contener sus controles/estándares organizados jerárquicamente.',
      },
      {
        step: '4',
        instruction:
          'Columnas obligatorias en "Standards": Código, Título, Nivel',
      },
      {
        step: '5',
        instruction:
          'Columnas opcionales en "Standards": Descripción, Código Padre, Orden, Auditable, Peso (%), Guía Auditor',
      },
      {
        step: '6',
        instruction:
          'Use "Código Padre" para crear jerarquías. Por ejemplo, si A.5.1.1 tiene padre A.5.1, el control A.5.1.1 será hijo de A.5.1',
      },
      {
        step: '7',
        instruction:
          'Los controles de nivel 1 (raíz) deben dejar el "Código Padre" vacío',
      },
      {
        step: '8',
        instruction:
          'El campo "Auditable" acepta: Sí, No, Yes, No, True, False, 1, 0',
      },
      {
        step: '9',
        instruction:
          'El campo "Peso (%)" es un número entre 0 y 100. Solo aplica a controles auditables. La suma total de pesos de todos los controles auditables debe ser 100.',
      },
      {
        step: '10',
        instruction:
          'El campo "Guía Auditor" puede contener recomendaciones sobre qué verificar o revisar durante la auditoría. Puede estar en cualquier nivel (auditable o no).',
      },
      {
        step: '11',
        instruction:
          'Una vez completado, guarde el archivo y súbalo usando el endpoint POST /templates/import',
      },
      {
        step: '12',
        instruction:
          'Al importar, puede proporcionar: name (obligatorio), version (obligatorio), code (opcional), description (opcional)',
      },
    ]

    sheet.addRows(instructions)

    // Aplicar formato
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }

        // Resaltar columna de pasos
        if (colNumber === 1 && rowNumber > 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }, // Lavanda
          }
          cell.font = { bold: true }
        }
      })

      // Ajustar altura de fila para instrucciones
      if (rowNumber > 1) {
        row.height = 30
        row.alignment = { vertical: 'middle', wrapText: true }
      }
    })

    // Título adicional
    const columnsRow = sheet.lastRow!.number + 2
    sheet.getCell(`A${columnsRow}`).value =
      '📚 COLUMNAS ACEPTADAS (español e inglés):'
    sheet.getCell(`A${columnsRow}`).font = { bold: true, size: 11 }
    sheet.mergeCells(`A${columnsRow}:B${columnsRow}`)

    const columnNames = [
      {
        step: '',
        instruction:
          '• Código, Codigo, Code | Título, Titulo, Title | Descripción, Descripcion, Description',
      },
      {
        step: '',
        instruction:
          '• Código Padre, Codigo Padre, Parent Code, ParentCode | Orden, Order | Nivel, Level',
      },
      {
        step: '',
        instruction: '• Auditable, Es Auditable, Is Auditable',
      },
      {
        step: '',
        instruction:
          '• Peso, Peso (%), Weight | Guía Auditor, Guia Auditor, Auditor Guidance, Guidance',
      },
    ]

    sheet.addRows(columnNames)

    // Formato para las columnas aceptadas
    const startRow = columnsRow + 1
    const endRow = startRow + columnNames.length - 1
    for (let i = startRow; i <= endRow; i++) {
      sheet.getRow(i).getCell(2).font = { italic: true, size: 10 }
      sheet.mergeCells(`A${i}:B${i}`)
    }
  }

  /**
   * Agrega un comentario a una celda
   */
  private addCellComment(
    sheet: ExcelJS.Worksheet,
    cellRef: string,
    comment: string,
  ): void {
    const cell = sheet.getCell(cellRef)
    cell.note = {
      texts: [{ text: comment }],
      margins: {
        insetmode: 'auto',
        inset: [0.13, 0.13, 0.25, 0.25],
      },
    }
  }

  /**
   * Genera el nombre del archivo de ejemplo
   */
  getFileName(): string {
    const timestamp = new Date().toISOString().split('T')[0]
    return `template_example_${timestamp}.xlsx`
  }
}

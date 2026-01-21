import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import * as XLSX from 'xlsx'
import { ImportStandardDto } from '../../../standards/dtos'
import { ParsedExcelData, ValidationError } from '../../interfaces/import-data.interface'

/**
 * Parse Excel Step
 *
 * Responsabilidad: SOLO parsear archivo Excel y extraer datos crudos
 * - Lee archivo Excel
 * - Extrae filas y columnas
 * - Convierte a DTOs (sin validar)
 * - Retorna datos + errores de parseo estructural
 */
@Injectable()
export class ParseExcelStep {
  private readonly logger = new Logger(ParseExcelStep.name)

  /**
   * Ejecuta el parseo de Excel
   */
  async execute(fileBuffer: Buffer): Promise<ParsedExcelData> {
    try {
      this.logger.log('📥 Parseando archivo Excel...')

      const workbook = XLSX.read(fileBuffer, {
        type: 'buffer',
        cellDates: true,
      })

      return this.parseStandardsSheet(workbook)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`❌ Error parseando Excel: ${errorMessage}`)
      throw new BadRequestException(
        'Error leyendo archivo Excel. Verifique que el formato sea válido.',
      )
    }
  }

  /**
   * Parsea la hoja "Estándares"
   */
  private parseStandardsSheet(workbook: XLSX.WorkBook): ParsedExcelData {
    const sheetName = 'Estándares'

    // Validar que exista la hoja
    if (!workbook.SheetNames.includes(sheetName)) {
      return {
        standards: [],
        errors: [
          {
            row: 0,
            field: 'sheet',
            value: sheetName,
            message: `Hoja "${sheetName}" no encontrada. Hojas disponibles: ${workbook.SheetNames.join(', ')}`,
          },
        ],
        totalRows: 0,
      }
    }

    const worksheet = workbook.Sheets[sheetName]
    const rawData = this.extractRawData(worksheet)

    // Validar que tenga datos
    if (rawData.length < 2) {
      return {
        standards: [],
        errors: [
          {
            row: 0,
            field: 'sheet',
            value: sheetName,
            message: 'Hoja vacía. Debe tener encabezados y al menos una fila de datos.',
          },
        ],
        totalRows: 0,
      }
    }

    const [headers, ...dataRows] = rawData

    // Validar encabezados
    const headerMapping = this.createHeaderMapping(headers)
    if (!headerMapping) {
      return {
        standards: [],
        errors: [
          {
            row: 1,
            field: 'headers',
            value: headers.join(', '),
            message:
              'Columnas incorrectas. Requeridas: codigo, titulo, descripcion, codigo_padre, orden, nivel, es_auditable, esta_activo',
          },
        ],
        totalRows: dataRows.length,
      }
    }

    // Parsear filas a DTOs (sin validar todavía)
    const standards = this.parseRows(dataRows, headerMapping)

    this.logger.log(`✅ Excel parseado: ${standards.length} filas extraídas`)

    return {
      standards,
      errors: [],
      totalRows: dataRows.length,
    }
  }

  /**
   * Extrae datos crudos del worksheet
   */
  private extractRawData(worksheet: XLSX.WorkSheet): string[][] {
    const data = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    })

    // Filtrar filas completamente vacías
    return data.filter((row) =>
      row.some((cell) => cell && cell.toString().trim() !== ''),
    )
  }

  /**
   * Crea mapping de columnas
   */
  private createHeaderMapping(headers: string[]): Record<number, string> | null {
    const mapping: Record<string, string> = {
      codigo: 'code',
      titulo: 'title',
      descripcion: 'description',
      codigo_padre: 'parentCode',
      orden: 'order',
      nivel: 'level',
      es_auditable: 'isAuditable',
      esta_activo: 'isActive',
    }

    const normalizedHeaders = headers.map((h) => this.normalizeString(h))
    const requiredColumns = Object.keys(mapping)

    // Verificar que todas las columnas requeridas existan
    const missingColumns = requiredColumns.filter(
      (col) => !normalizedHeaders.includes(col),
    )

    if (missingColumns.length > 0) {
      this.logger.warn(`Columnas faltantes: ${missingColumns.join(', ')}`)
      return null
    }

    // Construir mapeo índice → campo
    const headerMapping: Record<number, string> = {}
    headers.forEach((header, index) => {
      const normalized = this.normalizeString(header)
      const mappedField = mapping[normalized]
      if (mappedField) {
        headerMapping[index] = mappedField
      }
    })

    return headerMapping
  }

  /**
   * Parsea filas a DTOs
   */
  private parseRows(
    rows: string[][],
    headerMapping: Record<number, string>,
  ): ImportStandardDto[] {
    return rows.map((row) => {
      const obj: Record<string, unknown> = {}

      Object.entries(headerMapping).forEach(([indexStr, fieldName]) => {
        const index = parseInt(indexStr)
        const value = row[index]

        if (value !== undefined && value !== null) {
          const trimmedValue = value.toString().trim()
          obj[fieldName] =
            trimmedValue === '' ? undefined : this.convertValue(trimmedValue)
        } else {
          obj[fieldName] = undefined
        }
      })

      return plainToInstance(ImportStandardDto, obj, {
        enableImplicitConversion: true,
      })
    })
  }

  /**
   * Convierte valores a tipos apropiados
   */
  private convertValue(value: string): string | number | boolean {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
    if (/^\d+$/.test(value)) return parseInt(value, 10)
    if (/^\d*\.\d+$/.test(value)) return parseFloat(value)
    return value
  }

  /**
   * Normaliza string para comparación
   */
  private normalizeString(text: string): string {
    if (!text || typeof text !== 'string') return ''

    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9_]/g, '')
  }
}

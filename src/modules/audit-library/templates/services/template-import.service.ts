import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import * as ExcelJS from 'exceljs'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { ImportStandardDto, StandardEntity } from '../../standards'
import { TemplateEntity } from '../entities'

// Definimos interfaz local para evitar 'any' en el parseo
interface RawExcelRow {
  code: string
  title: string
  description?: string
  parentCode?: string
  order: number
  level: number
  isAuditable: boolean
  weight?: number
  auditorGuidance?: string
}

@Injectable()
export class TemplateImportService {
  private readonly logger = new Logger(TemplateImportService.name)

  constructor() {}

  async importTemplate(fileBuffer: Buffer): Promise<StandardEntity[]> {
    const start = Date.now()

    // 1. PARSEO: Buffer -> Objetos Crudos Tipados
    const rawRows = await this.parseExcel(fileBuffer)

    // 2. VALIDACIÓN: Objetos Crudos -> DTOs Validados
    const validDTOs = await this.validateRows(rawRows)

    this.logger.log(`✅ Importación completada en ${Date.now() - start}ms.`)
    // 3. CONSTRUCCIÓN: DTOs -> Entidades en Árbol
    return this.buildHierarchy(validDTOs)
  }

  // ===========================================================================
  // HELPERS PRIVADOS
  // ===========================================================================

  private readonly COLUMN_DEFINITIONS = {
    code: ['código', 'codigo', 'code'],
    title: ['título', 'titulo', 'title'],
    description: ['descripción', 'descripcion', 'description'],
    parentCode: ['código padre', 'codigo padre', 'parent code', 'parentcode'],
    order: ['orden', 'order'],
    level: ['nivel', 'level'],
    isAuditable: ['auditable', 'es auditable', 'is auditable'],
    weight: ['peso', 'peso (%)', 'weight'],
    auditorGuidance: [
      'guía auditor',
      'guia auditor',
      'auditor guidance',
      'guidance',
    ],
  }

  private async parseExcel(
    buffer: Buffer | Uint8Array,
  ): Promise<RawExcelRow[]> {
    const workbook = new ExcelJS.Workbook()

    await workbook.xlsx.load(buffer)
    const sheet = workbook.getWorksheet('Standards') || workbook.worksheets[0]
    if (!sheet) throw new BadRequestException('El archivo Excel no es válido.')

    // 1. MAPEO DINÁMICO DE COLUMNAS
    // Creamos un mapa: { 'code': 2, 'title': 3, ... }
    const columnMap = new Map<string, number>()
    const headerRow = sheet.getRow(1)

    headerRow.eachCell((cell, colNumber) => {
      const headerText = cell.text?.toLowerCase().trim()
      if (!headerText) return

      // Buscamos a qué campo corresponde esta cabecera
      for (const [fieldKey, possibleNames] of Object.entries(
        this.COLUMN_DEFINITIONS,
      )) {
        if (possibleNames.includes(headerText)) {
          columnMap.set(fieldKey, colNumber)
          break
        }
      }
    })

    // 2. VALIDAR COLUMNAS OBLIGATORIAS
    const requiredFields = ['code', 'title', 'level']
    const missingFields = requiredFields.filter(
      (field) => !columnMap.has(field),
    )

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Faltan columnas obligatorias en el Excel: ${missingFields.join(', ')}`,
      )
    }

    // 3. LEER DATOS USANDO EL MAPA
    const rows: RawExcelRow[] = []

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // Saltar header

      const getVal = (key: string) => {
        const colIndex = columnMap.get(key)
        // 1. Obtenemos el texto
        const rawVal = colIndex ? row.getCell(colIndex).text : undefined

        // 2. Quitamos espacios en blanco
        const trimmedVal = rawVal?.trim()

        // 3. EL TRUCO: Si es string vacío, devolvemos undefined
        return trimmedVal === '' ? undefined : trimmedVal
      }
      // Si la fila no tiene código, la ignoramos (fila vacía)
      const code = getVal('code')
      if (!code) return

      rows.push({
        code: code,
        title: getVal('title') || '',
        description: getVal('description'),
        parentCode: getVal('parentCode'),
        // Conversión segura de números
        order: this.parseNumber(getVal('order'), 0),
        level: this.parseNumber(getVal('level'), 1),
        isAuditable: this.parseBoolean(getVal('isAuditable')),
        weight: this.parseNumber(getVal('weight'), 0),
        auditorGuidance: getVal('auditorGuidance'),
      })
    })

    return rows
  }

  // Helper para números seguros
  private parseNumber(val: string | undefined, fallback: number): number {
    if (!val) return fallback
    const num = Number(val)
    return isNaN(num) ? fallback : num
  }

  private async validateRows(
    rawRows: RawExcelRow[],
  ): Promise<ImportStandardDto[]> {
    const errors: string[] = []

    // Transformamos a DTO
    const dtos = rawRows.map((row) => plainToInstance(ImportStandardDto, row))

    // Validamos en paralelo
    const validationResults = await Promise.all(
      dtos.map(async (dto, index) => {
        const validationErrors = await validate(dto)
        return validationErrors.length > 0
          ? { row: index + 2, errs: validationErrors }
          : null
      }),
    )

    // Recolectamos errores formateados
    validationResults.forEach((res) => {
      if (res) {
        const messages = res.errs
          .map((e) => Object.values(e.constraints || {}).join(', '))
          .join('; ')
        errors.push(`Fila ${res.row}: ${messages}`)
      }
    })

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'El archivo contiene errores de validación',
        errors: errors.slice(0, 20),
        totalErrors: errors.length,
      })
    }

    return dtos
  }

  /**
   * Construye el árbol usando Entidades reales de TypeORM
   */
  private buildHierarchy(dtos: ImportStandardDto[]): StandardEntity[] {
    const map = new Map<string, StandardEntity>()
    const roots: StandardEntity[] = []
    const hierarchyErrors: string[] = []

    // Paso A: Crear Instancias (Sin relaciones)
    dtos.forEach((dto) => {
      if (map.has(dto.code)) {
        hierarchyErrors.push(`Código duplicado detectado: ${dto.code}`)
        return
      }

      const entity = new StandardEntity()
      entity.code = dto.code
      entity.title = dto.title
      entity.description = dto.description || null
      entity.order = dto.order
      entity.level = dto.level
      entity.isAuditable = dto.isAuditable
      entity.children = []

      map.set(dto.code, entity)
    })

    if (hierarchyErrors.length > 0)
      throw new BadRequestException({
        message: 'Errores estructurales',
        errors: hierarchyErrors,
      })

    // Paso B: Enlazar (O(N))
    dtos.forEach((dto) => {
      const currentEntity = map.get(dto.code)! // Seguro porque acabamos de llenarlo
      const parentCode = dto.parentCode

      if (parentCode && parentCode !== '-') {
        const parentEntity = map.get(parentCode)

        if (!parentEntity) {
          hierarchyErrors.push(
            `El padre '${parentCode}' no existe (referenciado por '${dto.code}')`,
          )
        } else {
          // TypeORM Cascade necesita que el padre tenga al hijo en 'children'
          parentEntity.children.push(currentEntity)
          // Opcional: Asignar también el padre para doble seguridad
          // currentEntity.parent = parentEntity;
        }
      } else {
        roots.push(currentEntity)
      }
    })

    if (hierarchyErrors.length > 0) {
      throw new BadRequestException({
        message: 'Errores de jerarquía',
        errors: hierarchyErrors,
      })
    }

    // Validación final de sanidad
    if (roots.length === 0 && dtos.length > 0) {
      throw new BadRequestException(
        'Error Circular: No se encontraron nodos raíz.',
      )
    }

    return roots
  }

  private parseBoolean(val: any): boolean {
    if (!val) return false
    const s = String(val).toLowerCase().trim()
    return ['si', 'sí', 'yes', 'true', '1', 'verdadero'].includes(s)
  }

  // template-import.service.ts

  /**
   * Helper público: Vincula el ID del template a todo el árbol.
   * CAMBIO CLAVE: Usamos el ID, no la entidad completa, para evitar bucles infinitos.
   */
  public assignTemplateToTree(
    nodes: StandardEntity[],
    template: TemplateEntity,
  ) {
    nodes.forEach((node) => {
      node.templateId = template.id
      if (node.children?.length > 0) {
        this.assignTemplateToTree(node.children, template)
      }
    })
  }
}

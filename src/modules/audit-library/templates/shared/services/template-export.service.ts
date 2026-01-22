import { Injectable, Inject, Logger } from '@nestjs/common'
import * as ExcelJS from 'exceljs'
import type { ITemplatesRepository } from '../../repositories'
import type { IStandardsRepository } from '../../../standards/repositories'
import { TEMPLATES_REPOSITORY, STANDARDS_REPOSITORY } from '@core'
import { TemplateNotFoundException } from '../../exceptions'
import type { StandardEntity } from '../../../standards/entities'
import type { TemplateEntity } from '../../entities'

/**
 * Template Export Service
 *
 * Servicio para exportar plantillas a Excel con todos sus standards
 *
 * El archivo Excel generado tiene 2 hojas:
 * 1. "Template" - Metadatos de la plantilla
 * 2. "Standards" - Todos los standards en orden jerárquico
 *
 * Casos de uso:
 * - Backup de plantillas
 * - Compartir plantillas entre entornos
 * - Datos de prueba para desarrollo
 */
@Injectable()
export class TemplateExportService {
  private readonly logger = new Logger(TemplateExportService.name)

  constructor(
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templatesRepository: ITemplatesRepository,
    @Inject(STANDARDS_REPOSITORY)
    private readonly standardsRepository: IStandardsRepository,
  ) {}

  /**
   * Exporta una plantilla a Excel
   *
   * @param templateId - ID de la plantilla a exportar
   * @returns Buffer del archivo Excel
   * @throws {TemplateNotFoundException} Si la plantilla no existe
   */
  async exportTemplate(templateId: string): Promise<Buffer> {
    this.logger.log(`Exportando plantilla ${templateId} a Excel`)

    // 1. Obtener template con sus standards
    const template = await this.templatesRepository.findById(templateId)
    if (!template) {
      throw new TemplateNotFoundException(templateId)
    }

    // 2. Obtener todos los standards ordenados jerárquicamente
    const standards = await this.standardsRepository.findByTemplate(templateId)

    // 3. Crear workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Audit Core'
    workbook.created = new Date()

    // 4. Crear hoja de Template
    this.createTemplateSheet(workbook, template)

    // 5. Crear hoja de Standards
    this.createStandardsSheet(workbook, standards)

    // 6. Generar buffer
    const buffer = await workbook.xlsx.writeBuffer()

    this.logger.log(
      `Plantilla ${template.name} exportada exitosamente (${standards.length} standards)`,
    )

    return Buffer.from(buffer)
  }

  /**
   * Crea la hoja "Template" con los metadatos de la plantilla
   */
  private createTemplateSheet(
    workbook: ExcelJS.Workbook,
    template: TemplateEntity,
  ): void {
    const sheet = workbook.addWorksheet('Template')

    // Configurar columnas
    sheet.columns = [
      { header: 'Campo', key: 'field', width: 20 },
      { header: 'Valor', key: 'value', width: 50 },
    ]

    // Estilo del header
    sheet.getRow(1).font = { bold: true, size: 12 }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    }
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // Agregar datos del template
    const data = [
      { field: 'ID', value: template.id },
      { field: 'Código', value: template.code },
      { field: 'Nombre', value: template.name },
      { field: 'Descripción', value: template.description || '' },
      { field: 'Versión', value: template.version },
      { field: 'Estado', value: template.status },
      {
        field: 'Fecha Creación',
        value: template.createdAt?.toISOString() || '',
      },
      {
        field: 'Fecha Actualización',
        value: template.updatedAt?.toISOString() || '',
      },
    ]

    sheet.addRows(data)

    // Aplicar bordes
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      })
    })
  }

  /**
   * Crea la hoja "Standards" con todos los standards
   */
  private createStandardsSheet(
    workbook: ExcelJS.Workbook,
    standards: StandardEntity[],
  ): void {
    const sheet = workbook.addWorksheet('Standards')

    // Configurar columnas
    sheet.columns = [
      { header: 'ID', key: 'id', width: 38 },
      { header: 'Código', key: 'code', width: 15 },
      { header: 'Título', key: 'title', width: 50 },
      { header: 'Descripción', key: 'description', width: 60 },
      { header: 'Código Padre', key: 'parentId', width: 38 },
      { header: 'Nivel', key: 'level', width: 10 },
      { header: 'Orden', key: 'order', width: 10 },
      { header: 'Es Auditable', key: 'isAuditable', width: 15 },
    ]

    // Estilo del header
    sheet.getRow(1).font = { bold: true, size: 12 }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    }
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // Ordenar standards por nivel y orden
    const sortedStandards = this.sortStandardsHierarchically(standards)

    // Agregar datos de standards
    const rows = sortedStandards.map((standard) => ({
      id: standard.id,
      code: standard.code,
      title: standard.title,
      description: standard.description || '',
      parentId: standard.parentId || '',
      level: standard.level,
      order: standard.order,
      isAuditable: standard.isAuditable ? 'Sí' : 'No',
    }))

    sheet.addRows(rows)

    // Aplicar bordes
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      })
    })

    // Aplicar formato condicional por nivel (indentación visual)
    sortedStandards.forEach((standard, index) => {
      const rowNumber = index + 2 // +2 porque la fila 1 es header
      const row = sheet.getRow(rowNumber)

      // Colorear según nivel
      if (standard.level === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE7F3E7' }, // Verde muy claro
        }
        row.font = { bold: true }
      } else if (standard.level === 2) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F8FF' }, // Azul muy claro
        }
      }
    })
  }

  /**
   * Ordena los standards jerárquicamente (padres antes que hijos)
   * y por orden dentro del mismo nivel
   */
  private sortStandardsHierarchically(
    standards: StandardEntity[],
  ): StandardEntity[] {
    const standardsMap = new Map<string, StandardEntity>()
    const rootStandards: StandardEntity[] = []

    // Crear mapa de standards
    standards.forEach((standard) => {
      standardsMap.set(standard.id, standard)
    })

    // Identificar raíces
    standards.forEach((standard) => {
      if (!standard.parentId) {
        rootStandards.push(standard)
      }
    })

    // Ordenar raíces por orden
    rootStandards.sort((a, b) => a.order - b.order)

    // Función recursiva para ordenar jerárquicamente
    const buildHierarchy = (parent: StandardEntity): StandardEntity[] => {
      const children = standards
        .filter((s) => s.parentId === parent.id)
        .sort((a, b) => a.order - b.order)

      const result: StandardEntity[] = [parent]

      children.forEach((child) => {
        result.push(...buildHierarchy(child))
      })

      return result
    }

    // Construir jerarquía completa
    const result: StandardEntity[] = []
    rootStandards.forEach((root) => {
      result.push(...buildHierarchy(root))
    })

    return result
  }

  /**
   * Genera el nombre del archivo Excel
   */
  getFileName(template: TemplateEntity): string {
    const sanitizedName = template.name.replace(/[^a-zA-Z0-9]/g, '_')
    const timestamp = new Date().toISOString().split('T')[0]
    return `${sanitizedName}_v${template.version}_${timestamp}.xlsx`
  }
}

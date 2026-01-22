import { Injectable, Inject, Logger } from '@nestjs/common'
import * as ExcelJS from 'exceljs'
import type { ITemplatesRepository } from '../repositories'
import type { IStandardsRepository } from '../../standards/repositories'
import { TemplateNotFoundException } from '../exceptions'
import type { StandardEntity } from '../../standards/entities'
import type { TemplateEntity } from '../entities'
import { TEMPLATES_REPOSITORY } from '../tokens'
import { STANDARDS_REPOSITORY } from '../../standards/tokens'

/**
 * Template Export Service
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

  async exportTemplate(templateId: string): Promise<Buffer> {
    this.logger.log(`Exportando plantilla ${templateId} a Excel`)

    const template = await this.templatesRepository.findById(templateId)
    if (!template) {
      throw new TemplateNotFoundException(templateId)
    }

    const standards = await this.standardsRepository.findByTemplate(templateId)

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Audit Core'
    workbook.created = new Date()

    this.createTemplateSheet(workbook, template)
    this.createStandardsSheet(workbook, standards)

    const buffer = await workbook.xlsx.writeBuffer()

    this.logger.log(
      `Plantilla ${template.name} exportada exitosamente (${standards.length} standards)`,
    )

    return Buffer.from(buffer)
  }

  private createTemplateSheet(
    workbook: ExcelJS.Workbook,
    template: TemplateEntity,
  ): void {
    const sheet = workbook.addWorksheet('Template')

    sheet.columns = [
      { header: 'Campo', key: 'field', width: 20 },
      { header: 'Valor', key: 'value', width: 50 },
    ]

    sheet.getRow(1).font = { bold: true, size: 12 }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    }
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

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

  private createStandardsSheet(
    workbook: ExcelJS.Workbook,
    standards: StandardEntity[],
  ): void {
    const sheet = workbook.addWorksheet('Standards')

    // 1. Crear Mapa de Códigos para referencia rápida
    const codeMap = new Map<string, string>()
    standards.forEach((s) => codeMap.set(s.id, s.code))

    // 2. Configurar columnas (Con IDs ocultos y ParentCode visible)
    sheet.columns = [
      { header: 'ID (Sistema)', key: 'id', width: 0, hidden: true }, // OCULTO
      { header: 'Código', key: 'code', width: 15 },
      { header: 'Título', key: 'title', width: 80 },
      { header: 'Descripción', key: 'description', width: 60 },
      { header: 'Código Padre', key: 'parentCode', width: 15 }, // VISIBLE (UX)
      { header: 'ID Padre', key: 'parentId', width: 0, hidden: true }, // OCULTO
      { header: 'Nivel', key: 'level', width: 10 },
      { header: 'Orden', key: 'order', width: 10 },
      { header: 'Auditable', key: 'isAuditable', width: 15 },
    ]

    // Estilo del header (Tu estilo original)
    sheet.getRow(1).font = { bold: true, size: 12 }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    }
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // Ordenar standards (Tu lógica original)
    const sortedStandards = this.sortStandardsHierarchically(standards)

    // 3. Mapeo de datos usando el codeMap
    const rows = sortedStandards.map((standard) => {
      // Buscamos el código del padre ("A.5") usando su UUID
      const parentCode = standard.parentId
        ? codeMap.get(standard.parentId) || ''
        : ''

      return {
        id: standard.id,
        code: standard.code,
        title: standard.title,
        description: standard.description || '',
        parentCode: parentCode, // Visualmente útil
        parentId: standard.parentId || '', // Técnicamente útil (oculto)
        level: standard.level,
        order: standard.order,
        isAuditable: standard.isAuditable ? 'Sí' : 'No',
      }
    })

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

    // Aplicar formato condicional por nivel (Tu estilo original)
    sortedStandards.forEach((standard, index) => {
      const rowNumber = index + 2 // +2 porque la fila 1 es header
      const row = sheet.getRow(rowNumber)

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
   * Tu lógica de ordenamiento original recursiva.
   * Es correcta y funcional.
   */
  private sortStandardsHierarchically(
    standards: StandardEntity[],
  ): StandardEntity[] {
    const rootStandards: StandardEntity[] = []

    // Identificar raíces
    standards.forEach((standard) => {
      if (!standard.parentId) {
        rootStandards.push(standard)
      }
    })

    // Ordenar raíces por orden
    rootStandards.sort((a, b) => a.order - b.order)

    // Función recursiva
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

  getFileName(template: TemplateEntity): string {
    const sanitizedName = template.name.replace(/[^a-zA-Z0-9]/g, '_')
    const timestamp = new Date().toISOString().split('T')[0]
    return `${sanitizedName}_v${template.version}_${timestamp}.xlsx`
  }
}

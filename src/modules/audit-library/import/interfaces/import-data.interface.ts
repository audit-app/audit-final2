import { ImportStandardDto } from '../../standards/dtos'
import { ImportTemplateMetadataDto } from '../dtos'

/**
 * Validation error for a specific row/field
 */
export interface ValidationError {
  row: number
  field: string
  value: unknown
  message: string
}

/**
 * Raw data parsed from Excel (sin validar)
 */
export interface ParsedExcelData {
  standards: ImportStandardDto[]
  errors: ValidationError[]
  totalRows: number
}

/**
 * Data validada (individual + jerarquía)
 */
export interface ValidatedImportData {
  metadata: ImportTemplateMetadataDto
  standards: ImportStandardDto[]
  errors: ValidationError[]
  crossValidationErrors: ValidationError[]
  summary: {
    totalRows: number
    totalValidRows: number
    totalErrors: number
    hierarchyDepth: number
  }
  success: boolean
}

/**
 * Standard con hijos anidados (árbol)
 */
export interface StandardTreeNode {
  code: string
  title: string
  description?: string
  order: number
  level: number
  isAuditable: boolean
  isActive: boolean
  children: StandardTreeNode[]
}

/**
 * Template con árbol de standards
 */
export interface TemplateWithStandards {
  name: string
  code?: string
  description?: string
  version: string
  standards: StandardTreeNode[]
}

/**
 * Resultado final de la importación
 */
export interface ImportResult {
  success: boolean
  templateId?: string
  standardsCount?: number
  errors?: ValidationError[]
  message: string
}

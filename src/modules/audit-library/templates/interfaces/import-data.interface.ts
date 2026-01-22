import { ImportStandardDto } from '../../standards/dtos'

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

export interface ImportResult {
  success: boolean
  templateId?: string
  standardsCount?: number
  errors?: ValidationError[]
  message: string
}

import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm'
import { BaseEntity } from '@core/entities'
import { AuditResponseEntity } from './audit-response.entity'
import { WorkPaperType } from '../enums/work-paper-type.enum'

/**
 * Papel de trabajo / Evidencia adjunta a una evaluación de auditoría
 *
 * Representa archivos, imágenes, documentos adjuntos como evidencia
 * de la evaluación de un estándar.
 *
 * @example
 * ```typescript
 * const workPaper = {
 *   responseId: 'uuid-response',
 *   title: 'Política de respaldos firmada',
 *   description: 'Documento de política aprobado por gerencia',
 *   filePath: 'uploads/audits/2024/politica-respaldos.pdf',
 *   fileName: 'politica-respaldos.pdf',
 *   fileSize: 245760, // bytes
 *   mimeType: 'application/pdf',
 *   type: WorkPaperType.DOCUMENT,
 * }
 * ```
 */
@Entity('audit_work_papers')
@Index(['responseId'])
@Index(['uploadedBy'])
export class AuditWorkPaperEntity extends BaseEntity {
  /**
   * ID de la respuesta/evaluación a la que pertenece
   */
  @Column({ type: 'uuid' })
  responseId: string

  /**
   * Relación con la evaluación
   */
  @ManyToOne(() => AuditResponseEntity, (response) => response.workPapers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'responseId' })
  response: AuditResponseEntity

  /**
   * Título del papel de trabajo
   */
  @Column({ type: 'varchar', length: 255 })
  title: string

  /**
   * Descripción del contenido/propósito del archivo
   */
  @Column({ type: 'text', nullable: true })
  description: string | null

  /**
   * Ruta del archivo en el sistema de almacenamiento
   * Usa el sistema de files existente (@core/files)
   */
  @Column({ type: 'varchar', length: 500 })
  filePath: string

  /**
   * Nombre original del archivo
   */
  @Column({ type: 'varchar', length: 255 })
  fileName: string

  /**
   * Tamaño del archivo en bytes
   */
  @Column({ type: 'bigint' })
  fileSize: number

  /**
   * MIME type del archivo (image/jpeg, application/pdf, etc.)
   */
  @Column({ type: 'varchar', length: 100 })
  mimeType: string

  /**
   * Tipo categorizado del archivo
   */
  @Column({
    type: 'enum',
    enum: WorkPaperType,
    default: WorkPaperType.OTHER,
  })
  type: WorkPaperType

  /**
   * Usuario que subió el archivo
   */
  @Column({ type: 'uuid' })
  uploadedBy: string

  /**
   * Fecha de carga del archivo
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date

  /**
   * Determina el tipo de archivo basado en el MIME type
   */
  static determineFileType(mimeType: string): WorkPaperType {
    if (mimeType.startsWith('image/')) {
      return WorkPaperType.IMAGE
    }
    if (mimeType.startsWith('video/')) {
      return WorkPaperType.VIDEO
    }
    if (
      mimeType === 'application/pdf' ||
      mimeType.includes('word') ||
      mimeType === 'text/'
    ) {
      return WorkPaperType.DOCUMENT
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return WorkPaperType.SPREADSHEET
    }
    return WorkPaperType.OTHER
  }

  /**
   * Formatea el tamaño del archivo para mostrar (KB, MB, GB)
   */
  get fileSizeFormatted(): string {
    if (this.fileSize < 1024) return `${this.fileSize} B`
    if (this.fileSize < 1024 * 1024) {
      return `${(this.fileSize / 1024).toFixed(2)} KB`
    }
    if (this.fileSize < 1024 * 1024 * 1024) {
      return `${(this.fileSize / (1024 * 1024)).toFixed(2)} MB`
    }
    return `${(this.fileSize / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }
}

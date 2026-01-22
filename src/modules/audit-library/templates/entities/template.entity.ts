import { Entity, Column, OneToMany, Index } from 'typeorm'
import { BaseEntity } from '@core/entities/base.entity'
import { StandardEntity } from '../../standards/entities/standard.entity'
import { TemplateStatus } from '../constants/template-status.enum'
import { TEMPLATE_CONSTRAINTS } from '../constants'
@Entity('templates')
@Index(['name', 'version'], { unique: true })
export class TemplateEntity extends BaseEntity {
  @Column({ type: 'varchar', length: TEMPLATE_CONSTRAINTS.CODE.MAX_LENGTH })
  code: string

  @Column({ type: 'varchar', length: TEMPLATE_CONSTRAINTS.NAME.MAX_LENGTH })
  name: string

  @Column({ type: 'text' })
  description: string | null

  @Column({ type: 'varchar', length: TEMPLATE_CONSTRAINTS.VERSION.MAX_LENGTH })
  version: string

  @Column({
    type: 'enum',
    enum: TemplateStatus,
    default: TemplateStatus.DRAFT,
  })
  status: TemplateStatus

  @OneToMany(() => StandardEntity, (standard) => standard.template, {
    cascade: ['insert', 'update'], // Solo insert/update, NO remove (soft-delete manual)
  })
  standards: StandardEntity[]

  get isEditable(): boolean {
    return this.status === TemplateStatus.DRAFT
  }

  get isUsable(): boolean {
    return this.status === TemplateStatus.PUBLISHED
  }

  get isArchived(): boolean {
    return this.status === TemplateStatus.ARCHIVED
  }

  publish(): void {
    this.status = TemplateStatus.PUBLISHED
  }

  archive(): void {
    this.status = TemplateStatus.ARCHIVED
  }

  get canModifyStructure(): boolean {
    return this.status === TemplateStatus.DRAFT
  }

  /**
   * ¿Puedo corregir textos? (Títulos, Descripciones)
   * Permitido en Draft y Published (para typos).
   * Prohibido en Archived.
   */
  get canModifyContent(): boolean {
    return [TemplateStatus.DRAFT, TemplateStatus.PUBLISHED].includes(
      this.status,
    )
  }

  /**
   * ¿Se puede usar para iniciar una nueva auditoría?
   * Solo si está publicada.
   */
  get canStartAudit(): boolean {
    return this.status === TemplateStatus.PUBLISHED
  }
}

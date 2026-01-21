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

  @Column({
    type: 'text',
    length: TEMPLATE_CONSTRAINTS.DESCRIPTION.MAX_LENGTH,
  })
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
    cascade: true,
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
}

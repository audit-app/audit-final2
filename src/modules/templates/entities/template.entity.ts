import { Entity, Column, OneToMany, Index } from 'typeorm'
import { BaseEntity } from '@core/entities/base.entity'
import { StandardEntity } from '../../standards/entities/standard.entity'
import { TemplateStatus } from '../constants/template-status.enum'
@Entity('templates')
@Index(['name', 'version'], { unique: true })
export class TemplateEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'varchar', length: 20 })
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
}

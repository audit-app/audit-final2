import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm'
import { BaseEntity } from '@core/entities/base.entity'
import { TemplateEntity } from '../../templates/entities/template.entity'
import { STANDARDS_CONSTRAINTS } from '../constants'
import { BadRequestException } from '@nestjs/common'

/**
 * Standard Entity
 *
 * Representa un control, cláusula o estándar dentro de una plantilla
 * Estructura jerárquica (árbol) mediante parentId
 *
 * Ejemplos:
 * - ISO 27001: A.5 Políticas de seguridad de la información
 *   - A.5.1 Directrices de la dirección para la seguridad de la información
 *     - A.5.1.1 Políticas para la seguridad de la información
 *
 * @example
 * ```typescript
 * const standard = {
 *   templateId: 'uuid',
 *   parentId: null, // null = nivel raíz
 *   code: 'A.5',
 *   title: 'Políticas de seguridad de la información',
 *   description: '...',
 *   order: 1,
 *   level: 1,
 *   isAuditable: true,
 * }
 * ```
 */
@Entity('standards')
@Index(['templateId', 'code'], { unique: true })
@Index(['templateId', 'order'])
@Index(['parentId'])
export class StandardEntity extends BaseEntity {
  /**
   * ID de la plantilla a la que pertenece
   */
  @Column({ type: 'uuid' })
  templateId: string

  /**
   * Relación con la plantilla
   */
  @ManyToOne(() => TemplateEntity, (template) => template.standards, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'templateId' })
  template: TemplateEntity

  /**
   * ID del standard padre (para estructura jerárquica)
   * null = nivel raíz
   */
  @Column({ type: 'uuid', nullable: true })
  parentId: string | null

  /**
   * Relación con el standard padre
   */
  @ManyToOne(() => StandardEntity, (standard) => standard.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent: StandardEntity | null

  /**
   * Standards hijos de este standard
   */
  @OneToMany(() => StandardEntity, (standard) => standard.parent, {
    cascade: ['insert', 'update'],
  })
  children: StandardEntity[]

  /**
   * Código único del standard dentro de la plantilla
   * Ejemplos: 'A.5', 'A.5.1', 'A.5.1.1', '1.1', '1.2'
   */
  @Column({
    type: 'varchar',
    length: STANDARDS_CONSTRAINTS.CODE.MAX_LENGTH,
  })
  code: string

  @Column({
    type: 'varchar',
    length: STANDARDS_CONSTRAINTS.TITLE.MAX_LENGTH,
  })
  title: string

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null
  /**
   * Orden de visualización dentro de su nivel
   * Usado para ordenar hermanos
   */
  @Column({ type: 'int' })
  order: number

  /**
   * Nivel en la jerarquía (1 = raíz, 2 = hijo directo, etc.)
   * Calculado automáticamente basado en parentId
   */
  @Column({ type: 'int', default: 1 })
  level: number

  /**
   * Indica si este standard es auditable
   * Standards no auditables son solo organizacionales/agrupadores
   */
  @Column({ type: 'boolean', default: true })
  isAuditable: boolean

  /**
   * Peso/ponderación del estándar en evaluaciones (0-100)
   * Solo aplica si isAuditable = true
   * La suma de pesos de todos los standards auditables del template debe ser 100
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  weight: number

  /**
   * Guía/Recomendaciones para el auditor
   * Describe qué debe revisar, verificar o evaluar el auditor
   * Puede estar en cualquier nivel (auditable o no)
   *
   * @example
   * "Verificar existencia de política documentada y firmada por gerencia.
   *  Revisar fecha de última actualización (debe ser < 1 año).
   *  Confirmar que todo el personal conoce la política."
   */
  @Column({ type: 'text', nullable: true })
  auditorGuidance: string | null

  changeOrder(newOrder: number) {
    if (newOrder < 0) throw new BadRequestException('Orden inválido')
    this.order = newOrder
  }

  toggleAuditable(isAuditable: boolean) {
    this.isAuditable = isAuditable
  }

  setWeight(weight: number) {
    if (!this.isAuditable) {
      throw new BadRequestException(
        'No se puede asignar peso a un estándar no auditable',
      )
    }
    if (weight < 0 || weight > 100) {
      throw new BadRequestException('El peso debe estar entre 0 y 100')
    }
    this.weight = weight
  }

  setAuditorGuidance(guidance: string | null) {
    this.auditorGuidance = guidance
  }
}

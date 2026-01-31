import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm'
import { BaseEntity } from '@core/entities'
import { AuditEntity } from './audit.entity'
import { AuditWorkPaperEntity } from './audit-work-paper.entity'
import { StandardEntity } from '../../audit-library/standards/entities/standard.entity'
import { ResponseStatus } from '../enums/response-status.enum'
import { ComplianceLevel } from '../enums/compliance-level.enum'

/**
 * Evaluación/Respuesta de un estándar específico en una auditoría
 *
 * Representa la evaluación individual de cada estándar auditable.
 * Incluye score, nivel de cumplimiento, hallazgos y papeles de trabajo.
 *
 * @example
 * ```typescript
 * const response = {
 *   auditId: 'uuid-audit',
 *   standardId: 'uuid-standard',
 *   weight: 15.5, // Copiado del standard
 *   status: ResponseStatus.IN_PROGRESS,
 *   score: 75,
 *   complianceLevel: ComplianceLevel.PARTIAL,
 *   findings: 'No existe política documentada de respaldos',
 *   recommendations: 'Crear y publicar política de respaldos',
 * }
 * ```
 */
@Entity('audit_responses')
@Unique(['auditId', 'standardId'])
@Index(['auditId', 'status'])
@Index(['assignedUserId'])
export class AuditResponseEntity extends BaseEntity {
  /**
   * ID de la auditoría a la que pertenece
   */
  @Column({ type: 'uuid' })
  auditId: string

  /**
   * Relación con la auditoría
   */
  @ManyToOne(() => AuditEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auditId' })
  audit: AuditEntity

  /**
   * ID del estándar que se está evaluando
   */
  @Column({ type: 'uuid' })
  standardId: string

  /**
   * Relación con el estándar del template
   * RESTRICT: No permitir eliminar un estándar si tiene respuestas asociadas
   */
  @ManyToOne(() => StandardEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'standardId' })
  standard: StandardEntity

  /**
   * Peso/ponderación del estándar (copiado del template al crear auditoría)
   * Permite que la auditoría sea inmutable aunque el template cambie después
   * La suma de pesos de todos los estándares evaluados es 100
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  weight: number

  /**
   * Nivel de madurez alcanzado (según framework seleccionado)
   * null = sin framework o sin evaluar
   * Valores: 0-5 típicamente (según framework.minLevel - framework.maxLevel)
   */
  @Column({ type: 'int', nullable: true })
  achievedMaturityLevel: number | null

  /**
   * Estado de la evaluación
   */
  @Column({
    type: 'enum',
    enum: ResponseStatus,
    default: ResponseStatus.NOT_STARTED,
  })
  status: ResponseStatus

  /**
   * Puntuación numérica (0-100)
   * null = no evaluado aún
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number | null

  /**
   * Nivel de cumplimiento
   * null = no evaluado aún
   */
  @Column({
    type: 'enum',
    enum: ComplianceLevel,
    nullable: true,
  })
  complianceLevel: ComplianceLevel | null

  /**
   * Hallazgos/Observaciones del auditor
   * Descripción de lo que se encontró durante la evaluación
   */
  @Column({ type: 'text', nullable: true })
  findings: string | null

  /**
   * Recomendaciones del auditor
   * Acciones sugeridas para mejorar el cumplimiento
   */
  @Column({ type: 'text', nullable: true })
  recommendations: string | null

  /**
   * Notas internas del auditor
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null

  /**
   * Usuario asignado para evaluar este estándar
   * null = sin asignar
   */
  @Column({ type: 'uuid', nullable: true })
  assignedUserId: string | null

  /**
   * Usuario que revisó la evaluación (lead auditor)
   */
  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null

  /**
   * Fecha de revisión
   */
  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null

  /**
   * Papeles de trabajo adjuntos a esta evaluación
   */
  @OneToMany(() => AuditWorkPaperEntity, (workPaper) => workPaper.response, {
    cascade: ['insert', 'update'],
  })
  workPapers: AuditWorkPaperEntity[]

  /**
   * Calcula si la evaluación está completa
   */
  get isComplete(): boolean {
    return (
      this.status === ResponseStatus.COMPLETED ||
      this.status === ResponseStatus.REVIEWED
    )
  }

  /**
   * Calcula la contribución al score total de la auditoría
   * scoreTotal = (score * weight) / 100
   */
  get weightedScore(): number {
    if (this.score === null) return 0
    return (this.score * this.weight) / 100
  }
}

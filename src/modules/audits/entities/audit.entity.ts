import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm'
import { BaseEntity } from '@core/entities'
import { TemplateEntity } from '../../audit-library/templates/entities/template.entity'
import { OrganizationEntity } from '../../organizations/entities/organization.entity'
import { MaturityFrameworkEntity } from '../../maturity/frameworks/entities/maturity-framework.entity'
import { AuditStatus } from '../enums/audit-status.enum'
import { AuditAssignmentEntity } from './audit-assignment.entity'
import { AuditResponseEntity } from './audit-response.entity'

/**
 * Entidad de Auditoría (Ejecución de evaluación)
 *
 * Representa una instancia de auditoría basada en un template.
 * Permite crear auditorías de revisión basadas en auditorías anteriores.
 *
 * Flujo típico:
 * 1. DRAFT → Configurar template, organización, framework, miembros
 * 2. IN_PROGRESS → Iniciar auditoría (futura fase: capturar respuestas)
 * 3. CLOSED → Finalizar auditoría
 * 4. Crear nueva auditoría de REVISIÓN → parentAuditId apunta a la anterior
 *
 * @example Auditoría inicial
 * ```
 * Auditoría 1: ISO 27001 - Empresa XYZ
 * - parentAuditId: null
 * - status: CLOSED
 * ```
 *
 * @example Auditoría de revisión
 * ```
 * Auditoría 2: ISO 27001 - Empresa XYZ (Revisión 1)
 * - parentAuditId: id de Auditoría 1
 * - status: DRAFT
 * ```
 */
@Entity('audits')
@Index(['organizationId', 'status'])
@Index(['templateId'])
@Index(['parentAuditId'])
export class AuditEntity extends BaseEntity {
  /**
   * Código único de la auditoría
   * Formato: AUD-YYYY-NNN (ej: AUD-2024-001)
   */
  @Column({ length: 50, unique: true })
  @Index()
  code: string

  /**
   * Nombre descriptivo de la auditoría
   */
  @Column({ length: 255 })
  name: string

  /**
   * Descripción detallada (opcional)
   */
  @Column({ type: 'text', nullable: true })
  description: string | null

  // ═══════════════════════════════════════════════════════════
  // RELACIONES PRINCIPALES
  // ═══════════════════════════════════════════════════════════

  /**
   * Template base (qué se va a auditar)
   * Debe estar en estado PUBLISHED
   */
  @Column({ type: 'uuid' })
  templateId: string

  @ManyToOne(() => TemplateEntity)
  @JoinColumn({ name: 'templateId' })
  template: TemplateEntity

  /**
   * Organización auditada (a quién se audita)
   */
  @Column({ type: 'uuid' })
  organizationId: string

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity

  /**
   * Framework de madurez utilizado (opcional)
   * Ej: COBIT 5, CMMI
   */
  @Column({ type: 'uuid', nullable: true })
  frameworkId: string | null

  @ManyToOne(() => MaturityFrameworkEntity, { nullable: true })
  @JoinColumn({ name: 'frameworkId' })
  framework: MaturityFrameworkEntity | null

  // ═══════════════════════════════════════════════════════════
  // AUDITORÍAS DE REVISIÓN (FOLLOW-UP)
  // ═══════════════════════════════════════════════════════════

  /**
   * Auditoría padre (para auditorías de revisión)
   * Si es null, es una auditoría inicial
   * Si tiene valor, es una revisión de otra auditoría
   */
  @Column({ type: 'uuid', nullable: true })
  parentAuditId: string | null

  @ManyToOne(() => AuditEntity, (audit) => audit.childAudits, {
    nullable: true,
  })
  @JoinColumn({ name: 'parentAuditId' })
  parentAudit: AuditEntity | null

  /**
   * Auditorías hijas (revisiones basadas en esta)
   */
  @OneToMany(() => AuditEntity, (audit) => audit.parentAudit)
  childAudits: AuditEntity[]

  /**
   * Número de revisión
   * 0 = auditoría inicial
   * 1 = primera revisión
   * 2 = segunda revisión, etc.
   */
  @Column({ type: 'int', default: 0 })
  revisionNumber: number

  // ═══════════════════════════════════════════════════════════
  // ESTADO Y FECHAS
  // ═══════════════════════════════════════════════════════════

  /**
   * Estado actual de la auditoría
   */
  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.DRAFT,
  })
  status: AuditStatus

  /**
   * Fecha de inicio planificada
   */
  @Column({ type: 'timestamp', nullable: true })
  startDate: Date | null

  /**
   * Fecha de fin planificada
   */
  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null

  /**
   * Fecha real de inicio (cuando se inicia la auditoría)
   */
  @Column({ type: 'timestamp', nullable: true })
  actualStartDate: Date | null

  /**
   * Fecha real de cierre
   */
  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null

  // ═══════════════════════════════════════════════════════════
  // SCORE Y RESULTADOS (FUTURO)
  // ═══════════════════════════════════════════════════════════

  /**
   * Score general de cumplimiento (0-100)
   * Se calculará cuando se implemente el módulo de respuestas
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  overallScore: number | null

  /**
   * Nivel de madurez alcanzado (basado en framework)
   * Valores típicos: 0-5
   */
  @Column({ type: 'int', nullable: true })
  maturityLevel: number | null

  // ═══════════════════════════════════════════════════════════
  // RELACIONES CON OTROS MÓDULOS
  // ═══════════════════════════════════════════════════════════

  /**
   * Miembros asignados a la auditoría
   */
  @OneToMany(() => AuditAssignmentEntity, (assignment) => assignment.audit, {
    cascade: true,
  })
  assignments: AuditAssignmentEntity[]

  /**
   * Respuestas/Evaluaciones de cada estándar
   * Se crean automáticamente al crear la auditoría
   */
  @OneToMany(() => AuditResponseEntity, (response) => response.audit, {
    cascade: true,
  })
  responses: AuditResponseEntity[]

  // ═══════════════════════════════════════════════════════════
  // GETTERS Y MÉTODOS DE NEGOCIO
  // ═══════════════════════════════════════════════════════════

  /**
   * Indica si la auditoría se puede editar
   * Solo en estado DRAFT
   */
  get isEditable(): boolean {
    return this.status === AuditStatus.DRAFT
  }

  /**
   * Indica si la auditoría se puede iniciar
   * Debe estar en DRAFT y tener al menos un miembro asignado
   */
  get canStart(): boolean {
    return (
      this.status === AuditStatus.DRAFT &&
      this.assignments &&
      this.assignments.length > 0
    )
  }

  /**
   * Indica si la auditoría está activa (en ejecución)
   */
  get isActive(): boolean {
    return this.status === AuditStatus.IN_PROGRESS
  }

  /**
   * Indica si la auditoría está cerrada
   */
  get isClosed(): boolean {
    return this.status === AuditStatus.CLOSED
  }

  /**
   * Indica si se puede crear una auditoría de revisión a partir de esta
   * Solo si está CLOSED
   */
  get canCreateRevision(): boolean {
    return this.status === AuditStatus.CLOSED
  }

  /**
   * Indica si la auditoría es una revisión de otra
   */
  get isRevision(): boolean {
    return this.parentAuditId !== null
  }

  /**
   * Indica si es una auditoría inicial (no es revisión)
   */
  get isInitial(): boolean {
    return this.parentAuditId === null
  }
}

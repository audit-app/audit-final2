import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm'
import { BaseEntity } from '@core/entities'
import { AuditEntity } from './audit.entity'
import { UserEntity } from '../../users/entities/user.entity'
import { AuditRole } from '../enums/audit-role.enum'

/**
 * Entidad de Asignación de Miembros a Auditoría
 *
 * Representa la asignación de un usuario (miembro del equipo) a una auditoría
 * con un rol específico.
 *
 * Características:
 * - Un usuario puede estar asignado múltiples veces a la misma auditoría con roles diferentes
 * - Se pueden asignar estándares específicos a un miembro (opcional)
 * - Permite desactivar asignaciones sin eliminarlas
 *
 * @example Equipo típico
 * ```
 * Auditoría ISO 27001 - Empresa XYZ:
 * - Juan Pérez → LEAD_AUDITOR (todos los estándares)
 * - María García → AUDITOR (estándares A.5, A.6)
 * - Pedro López → AUDITEE (representante de la organización)
 * - Ana Torres → OBSERVER (solo puede ver)
 * ```
 */
@Entity('audit_assignments')
@Unique(['auditId', 'userId', 'role']) // Un usuario no puede tener el mismo rol dos veces
@Index(['auditId'])
@Index(['userId'])
export class AuditAssignmentEntity extends BaseEntity {
  // ═══════════════════════════════════════════════════════════
  // RELACIONES PRINCIPALES
  // ═══════════════════════════════════════════════════════════

  /**
   * Auditoría a la que se asigna el miembro
   */
  @Column({ type: 'uuid' })
  auditId: string

  @ManyToOne(() => AuditEntity, (audit) => audit.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'auditId' })
  audit: AuditEntity

  /**
   * Usuario asignado (miembro del equipo)
   */
  @Column({ type: 'uuid' })
  userId: string

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity

  // ═══════════════════════════════════════════════════════════
  // ROL Y PERMISOS
  // ═══════════════════════════════════════════════════════════

  /**
   * Rol del miembro en la auditoría
   *
   * LEAD_AUDITOR: Líder del equipo (coordina)
   * AUDITOR: Auditor del equipo (ejecuta evaluaciones)
   * AUDITEE: Auditado (proporciona información)
   * OBSERVER: Observador (solo lectura)
   */
  @Column({
    type: 'enum',
    enum: AuditRole,
    default: AuditRole.AUDITOR,
  })
  role: AuditRole

  // ═══════════════════════════════════════════════════════════
  // ASIGNACIÓN DE ESTÁNDARES (OPCIONAL)
  // ═══════════════════════════════════════════════════════════

  /**
   * IDs de estándares asignados específicamente a este miembro
   *
   * - null: El miembro tiene acceso a TODOS los estándares de la auditoría
   * - []: Array vacío significa ningún estándar asignado (aún no se asignaron)
   * - ['uuid1', 'uuid2']: Solo puede trabajar con estos estándares
   *
   * Útil para dividir trabajo entre auditores
   */
  @Column({ type: 'jsonb', nullable: true })
  assignedStandardIds: string[] | null

  // ═══════════════════════════════════════════════════════════
  // METADATA Y NOTAS
  // ═══════════════════════════════════════════════════════════

  /**
   * Notas sobre la asignación
   * Ej: "Responsable de sección A.5", "Experto en controles de acceso"
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null

  /**
   * Indica si la asignación está activa
   * Permite desactivar sin eliminar (mantener historial)
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean

  // ═══════════════════════════════════════════════════════════
  // GETTERS Y MÉTODOS DE NEGOCIO
  // ═══════════════════════════════════════════════════════════

  /**
   * Indica si el miembro es líder del equipo
   */
  get isLeadAuditor(): boolean {
    return this.role === AuditRole.LEAD_AUDITOR
  }

  /**
   * Indica si el miembro es auditor
   */
  get isAuditor(): boolean {
    return (
      this.role === AuditRole.AUDITOR || this.role === AuditRole.LEAD_AUDITOR
    )
  }

  /**
   * Indica si el miembro es auditado (cliente)
   */
  get isAuditee(): boolean {
    return this.role === AuditRole.AUDITEE
  }

  /**
   * Indica si el miembro solo puede observar
   */
  get isObserver(): boolean {
    return this.role === AuditRole.OBSERVER
  }

  /**
   * Indica si el miembro tiene acceso a todos los estándares
   */
  get hasAccessToAllStandards(): boolean {
    return this.assignedStandardIds === null
  }

  /**
   * Indica si el miembro tiene estándares específicos asignados
   */
  get hasSpecificStandards(): boolean {
    return (
      this.assignedStandardIds !== null && this.assignedStandardIds.length > 0
    )
  }

  /**
   * Verifica si el miembro tiene acceso a un estándar específico
   */
  hasAccessToStandard(standardId: string): boolean {
    if (this.assignedStandardIds === null) {
      return true // Acceso a todos
    }
    return this.assignedStandardIds.includes(standardId)
  }
}

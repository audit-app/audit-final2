import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm'

/**
 * Tipos de acción auditables
 */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ARCHIVE = 'ARCHIVE',
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  PUBLISH = 'PUBLISH',
}

/**
 * Formato de un cambio individual en el audit log
 */
export interface AuditChange {
  field: string
  oldValue: unknown
  newValue: unknown
}

/**
 * Entidad de Auditoría Granular
 *
 * Guarda un snapshot completo de cada cambio realizado en Template y Standard.
 * Diseñada para ser consultada eficientemente por rootId (el ID del template).
 *
 * Características:
 * - Snapshot inmutable del usuario (no se ve afectado por cambios posteriores)
 * - Desnormalización: guarda rootId para agrupar todo el historial de una plantilla
 * - Cambios en formato JSONB para flexibilidad y consultas rápidas
 * - Índices optimizados para queries por template
 *
 * @example
 * ```typescript
 * // Consultar historial completo de una plantilla
 * const logs = await auditLogRepository.find({
 *   where: { rootId: templateId },
 *   order: { createdAt: 'DESC' }
 * })
 * ```
 */
@Entity('audit_logs')
@Index(['rootId', 'createdAt']) // Query principal: historial de template ordenado
@Index(['entityId']) // Query por entidad específica
@Index(['userId']) // Query por usuario
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn()
  createdAt: Date

  // ========================================
  // QUIÉN (Snapshot del usuario)
  // ========================================

  /**
   * ID del usuario que realizó la acción
   * Null si fue una acción del sistema (seed, migration, cron)
   */
  @Column({ type: 'uuid', nullable: true })
  userId: string | null

  /**
   * Nombre completo del usuario en el momento de la acción
   * Snapshot inmutable - no cambia si el usuario cambia su nombre
   */
  @Column({ type: 'varchar', length: 200, nullable: true })
  userFullName: string | null

  /**
   * Email del usuario en el momento de la acción
   * Snapshot inmutable - no cambia si el usuario cambia su email
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  userEmail: string | null

  // ========================================
  // QUÉ Y DÓNDE (Identificadores)
  // ========================================

  /**
   * Tipo de entidad afectada
   * 'Template' o 'Standard'
   */
  @Column({ type: 'varchar', length: 50 })
  entity: string

  /**
   * ID de la entidad afectada (template o standard)
   */
  @Column({ type: 'uuid' })
  entityId: string

  /**
   * ID del Template raíz (agrupador)
   *
   * - Si entity = 'Template' → rootId = template.id
   * - Si entity = 'Standard' → rootId = standard.templateId
   *
   * Permite traer todo el historial de una plantilla con una query:
   * WHERE rootId = templateId ORDER BY createdAt DESC
   */
  @Index()
  @Column({ type: 'uuid' })
  rootId: string

  // ========================================
  // CÓMO (Tipo de acción)
  // ========================================

  /**
   * Acción realizada
   */
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction

  // ========================================
  // DETALLE (Los cambios)
  // ========================================

  /**
   * Array de cambios realizados
   *
   * Formato: [{ field: campo, oldValue: valor_anterior, newValue: valor_nuevo }]
   *
   * Para CREATE: null o []
   * Para DELETE/ARCHIVE: null o snapshot del estado final
   *
   * @example
   * [
   *   {
   *     "field": "title",
   *     "oldValue": "Contraseñas",
   *     "newValue": "Política de Contraseñas"
   *   },
   *   {
   *     "field": "isActive",
   *     "oldValue": false,
   *     "newValue": true
   *   }
   * ]
   */
  @Column({ type: 'jsonb', nullable: true })
  changes: AuditChange[] | null

  /**
   * Metadata adicional opcional (para extensibilidad futura)
   *
   * Puede incluir: IP, User-Agent, razón del cambio, etc.
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null
}

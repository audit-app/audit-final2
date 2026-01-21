import {
  EventSubscriber,
  EntitySubscriberInterface,
  UpdateEvent,
  InsertEvent,
  SoftRemoveEvent,
  DataSource,
} from 'typeorm'
import { Injectable } from '@nestjs/common'
import { AuditService } from '@core/database/audit.service'
import { TemplateEntity } from '../../../modules/templates/entities/template.entity'
import { StandardEntity } from '../../../modules/standards/entities/standard.entity'
import { TemplateStatus } from '../../../modules/templates/constants/template-status.enum'
import { AuditLogEntity, AuditAction } from '../entities/audit-log.entity'

/**
 * Granular Audit Subscriber
 *
 * Subscriber de TypeORM que detecta automáticamente cambios en Template y Standard
 * y crea registros de auditoría granular en AuditLogEntity.
 *
 * Características:
 * - Detecta INSERT, UPDATE, SOFT_REMOVE automáticamente
 * - Calcula diferencias campo por campo
 * - Guarda snapshot del usuario desde CLS
 * - Calcula rootId automáticamente
 * - Se ejecuta dentro de la misma transacción
 * - **FILTRA RUIDO**: NO audita cambios en estado DRAFT (modo edición)
 *
 * Estrategia de Auditoría por Estado:
 * - **DRAFT**: NO audita (cambios experimentales, ruido)
 * - **PUBLISHED/ARCHIVED**: SÍ audita (cambios en producción, críticos)
 * - **Cambio de estado**: SÍ audita (DRAFT → PUBLISHED es importante)
 *
 * Campos ignorados (no se auditan):
 * - updatedAt: Se actualiza en cada cambio (ruido)
 * - updatedBy: Ya está en el snapshot de usuario
 * - deletedAt: Se maneja con acción ARCHIVE
 * - createdAt/createdBy: Solo relevantes en CREATE
 *
 * @example
 * ```typescript
 * // Modo DRAFT (NO se audita):
 * template.status = 'draft'
 * template.name = 'Cambio 1'  // NO audita
 * template.name = 'Cambio 2'  // NO audita
 *
 * // Publicación (SÍ se audita):
 * template.status = 'published'  // ✅ Audita cambio de estado
 *
 * // Modo PUBLISHED (SÍ se audita):
 * template.description = 'Corrección'  // ✅ Audita
 * ```
 */
@Injectable()
@EventSubscriber()
export class GranularAuditSubscriber implements EntitySubscriberInterface {
  constructor(
    dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {
    dataSource.subscribers.push(this)
  }

  /**
   * ⚠️ NO implementamos listenTo() porque TypeORM no soporta arrays
   *
   * TypeORM requiere: listenTo(): Function | string (NO array)
   * Para escuchar múltiples entidades, filtramos manualmente con shouldAudit()
   *
   * Performance: La comparación de strings es ~nanosegundos, no hay impacto
   */

  /**
   * Después de INSERT - Registra creación
   */
  async afterInsert(event: InsertEvent<any>): Promise<void> {
    // Filtrar solo Template y Standard
    if (!this.shouldAudit(event.metadata.name)) {
      return
    }
    await this.saveLog(event, AuditAction.CREATE, null)
  }

  /**
   * Después de UPDATE - Registra cambios campo por campo
   */
  async afterUpdate(event: UpdateEvent<any>): Promise<void> {
    // Filtrar solo Template y Standard
    if (!this.shouldAudit(event.metadata.name)) {
      return
    }

    if (!event.databaseEntity || !event.entity) {
      return // No hay datos para comparar
    }

    // 🚦 EL PORTERO: Filtrar ruido de DRAFT
    const shouldAuditChange = await this.shouldAuditBasedOnStatus(event)
    if (!shouldAuditChange) {
      return // Es DRAFT, no auditar
    }

    const changes = this.calculateChanges(event)

    // Solo registrar si hubo cambios reales
    if (Object.keys(changes).length > 0) {
      await this.saveLog(event, AuditAction.UPDATE, changes)
    }
  }

  /**
   * Después de SOFT_REMOVE - Registra archivo/eliminación
   */
  async afterSoftRemove(event: SoftRemoveEvent<any>): Promise<void> {
    // Filtrar solo Template y Standard
    if (!this.shouldAudit(event.metadata.name)) {
      return
    }
    await this.saveLog(event, AuditAction.ARCHIVE, null)
  }

  /**
   * 🔍 Filtro de tipo de entidad (ultra-rápido)
   *
   * Verifica si la entidad debe ser auditada
   * Performance: ~1 nanosegundo (comparación de strings)
   *
   * @param entityName - Nombre de la entidad (ej: 'TemplateEntity')
   * @returns true si es Template o Standard, false para otras entidades
   */
  private shouldAudit(entityName: string): boolean {
    return entityName === 'TemplateEntity' || entityName === 'StandardEntity'
  }

  /**
   * 🚦 EL PORTERO: Verifica si debe auditar basado en el estado del Template
   *
   * Reglas:
   * 1. Template en DRAFT (old y new) → NO auditar (ruido)
   * 2. Template cambia de estado → SÍ auditar (importante)
   * 3. Standard con Template padre en DRAFT → NO auditar
   * 4. Standard con Template padre en PUBLISHED/ARCHIVED → SÍ auditar
   *
   * @param event - Evento de actualización
   * @returns true si debe auditar, false si es ruido (DRAFT)
   */
  private async shouldAuditBasedOnStatus(
    event: UpdateEvent<any>,
  ): Promise<boolean> {
    const entityName = event.metadata.name
    const oldData = event.databaseEntity
    const newData = event.entity

    if (!oldData || !newData) {
      return true // Sin datos, auditar por defecto
    }

    // ========================================
    // CASO 1: Es un TEMPLATE
    // ========================================
    if (entityName === 'TemplateEntity') {
      const oldStatus = oldData.status
      const newStatus = newData.status

      // Si AMBOS estados son DRAFT → NO auditar (edición de borrador)
      if (oldStatus === TemplateStatus.DRAFT && newStatus === TemplateStatus.DRAFT) {
        return false // 🔇 Silenciar ruido de DRAFT
      }

      // Si cambia de estado (ej: DRAFT → PUBLISHED) → SÍ auditar
      // Si está en PUBLISHED/ARCHIVED → SÍ auditar
      return true
    }

    // ========================================
    // CASO 2: Es un STANDARD (hijo)
    // ========================================
    if (entityName === 'StandardEntity') {
      // Necesitamos saber el estado del Template padre

      // Opción A: Si la relación ya está cargada (optimización)
      if (newData.template?.status) {
        return newData.template.status !== TemplateStatus.DRAFT
      }

      // Opción B: Consulta ligera al Template padre
      const templateId = newData.templateId || oldData.templateId

      if (!templateId) {
        console.warn(
          '[GranularAuditSubscriber] Standard sin templateId, auditando por defecto',
        )
        return true
      }

      // Query ultra-ligera: solo el campo status
      const template = await event.manager.findOne(TemplateEntity, {
        where: { id: templateId },
        select: ['status'], // Solo traemos status (rápido)
      })

      // Si el padre es DRAFT → NO auditar el hijo
      if (template?.status === TemplateStatus.DRAFT) {
        return false // 🔇 Padre en DRAFT, silenciar
      }

      // Padre en PUBLISHED/ARCHIVED → SÍ auditar
      return true
    }

    // Otras entidades (futuro) → auditar por defecto
    return true
  }

  /**
   * Calcula las diferencias entre el estado anterior y el nuevo
   *
   * @param event - Evento de actualización
   * @returns Objeto con cambios en formato { campo: { old, new } }
   */
  private calculateChanges(
    event: UpdateEvent<any>,
  ): Record<string, { old: unknown; new: unknown }> {
    const changes: Record<string, { old: unknown; new: unknown }> = {}
    const oldData = event.databaseEntity
    const newData = event.entity

    if (!oldData || !newData) {
      return changes
    }

    // Campos a ignorar (generan ruido innecesario)
    const ignoredFields = ['updatedAt', 'updatedBy', 'deletedAt', 'version']

    event.updatedColumns.forEach((col) => {
      const key = col.propertyName
      if (ignoredFields.includes(key)) {
        return
      }

      const oldVal = oldData[key]
      const newVal = newData[key]

      // Solo guardar si son realmente diferentes
      // Usar != para manejar null vs undefined correctamente
      if (oldVal != newVal) {
        changes[key] = {
          old: oldVal,
          new: newVal,
        }
      }
    })

    return changes
  }

  /**
   * Guarda el registro de auditoría en la base de datos
   *
   * @param event - Evento de TypeORM
   * @param action - Tipo de acción realizada
   * @param changes - Cambios detectados (null para CREATE/ARCHIVE)
   */
  private async saveLog(
    event: InsertEvent<any> | UpdateEvent<any> | SoftRemoveEvent<any>,
    action: AuditAction,
    changes: Record<string, { old: unknown; new: unknown }> | null,
  ): Promise<void> {
    // 1. Obtener snapshot del usuario desde CLS
    const user = this.auditService.getCurrentUser()

    // Fallback para operaciones del sistema (seeds, migrations, crons)
    const userId = user?.userId || null
    const userFullName = user?.fullName || 'Sistema'
    const userEmail = user?.email || null

    // 2. Obtener datos de la entidad
    const entity = event.entity
    const oldEntity = 'databaseEntity' in event ? event.databaseEntity : null
    const entityName = event.metadata.name.replace('Entity', '') // 'Template' o 'Standard'

    // 3. Calcular rootId (agrupador)
    let rootId: string

    if (entityName === 'Template') {
      // Para templates, el root es su propio ID
      rootId = entity.id
    } else if (entityName === 'Standard') {
      // Para standards, el root es el templateId
      // 🐛 FIX: En updates, entity solo tiene campos modificados
      // Usamos oldEntity (databaseEntity) como fallback
      rootId = entity.templateId || oldEntity?.templateId

      if (!rootId) {
        console.error(
          '[GranularAuditSubscriber] Standard sin templateId (ni en entity ni en oldEntity)',
          { entity, oldEntity },
        )
        return // No se puede auditar sin rootId
      }
    } else {
      console.warn(
        `[GranularAuditSubscriber] Entidad no esperada: ${entityName}`,
      )
      return
    }

    // 4. Construir el log
    const log = new AuditLogEntity()
    log.userId = userId
    log.userFullName = userFullName
    log.userEmail = userEmail
    log.entity = entityName
    log.entityId = entity.id
    log.rootId = rootId
    log.action = action
    log.changes = changes
    log.metadata = null // Extensible para IP, User-Agent, etc.

    // 5. Guardar dentro de la misma transacción
    try {
      await event.manager.save(AuditLogEntity, log)
    } catch (error) {
      // Log del error pero no fallar la operación principal
      console.error('[GranularAuditSubscriber] Error al guardar log:', error)
    }
  }
}

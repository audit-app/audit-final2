import {
  EventSubscriber,
  EntitySubscriberInterface,
  UpdateEvent,
  SoftRemoveEvent,
  DataSource,
  ObjectLiteral,
} from 'typeorm'
import { Injectable, Logger } from '@nestjs/common'
import { AuditService } from '@core/database/audit.service'
import { TemplateEntity } from '../../templates/entities/template.entity'
import { StandardEntity } from '../../standards/entities/standard.entity'
import { TemplateStatus } from '../../templates/constants/template-status.enum'
import { AuditLogEntity, AuditAction } from '../entities/audit-log.entity'

type SafeData = Record<string, unknown>
// Tipo unión para acceso seguro a propiedades
type AuditableEntity = TemplateEntity | StandardEntity

@Injectable()
@EventSubscriber()
export class GranularAuditSubscriber implements EntitySubscriberInterface<ObjectLiteral> {
  private readonly logger = new Logger(GranularAuditSubscriber.name)

  constructor(
    dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {
    dataSource.subscribers.push(this)
  }

  /**
   * ❌ afterInsert ELIMINADO
   * No auditamos la creación porque no hay cambios que comparar.
   */

  /**
   * Después de UPDATE - Registra cambios campo por campo
   */
  async afterUpdate(event: UpdateEvent<ObjectLiteral>): Promise<void> {
    // 1. Filtrar entidad
    if (!this.shouldAudit(event.metadata.name)) return

    // 2. Verificar datos necesarios
    if (!event.databaseEntity || !event.entity) return

    // 3. Filtrar por Estado (Ruido DRAFT vs PUBLISHED)
    const shouldAudit = await this.shouldAuditUpdate(event)
    if (!shouldAudit) return

    // 4. Calcular cambios
    const changes = this.calculateChanges(event)

    // 5. Guardar solo si hay diferencias reales
    if (Object.keys(changes).length > 0) {
      await this.saveLog(event, AuditAction.UPDATE, changes)
    }
  }

  /**
   * Después de SOFT_REMOVE - Registra archivo/eliminación
   * Esto SÍ se mantiene porque es un evento crítico de ciclo de vida.
   */
  async afterSoftRemove(event: SoftRemoveEvent<ObjectLiteral>): Promise<void> {
    if (!this.shouldAudit(event.metadata.name)) return
    await this.saveLog(event, AuditAction.ARCHIVE, null)
  }

  /**
   * Filtro rápido de entidades
   */
  private shouldAudit(entityName: string): boolean {
    return entityName === 'TemplateEntity' || entityName === 'StandardEntity'
  }

  /**
   * 🚦 EL PORTERO: Lógica simplificada solo para UPDATES
   * Verifica si vale la pena auditar el cambio basándose en el estado.
   */
  private async shouldAuditUpdate(
    event: UpdateEvent<ObjectLiteral>,
  ): Promise<boolean> {
    const entityName = event.metadata.name

    // Casting seguro
    const newData = event.entity as AuditableEntity
    const oldData = event.databaseEntity as AuditableEntity

    // ----------------------------------------
    // Lógica TEMPLATE
    // ----------------------------------------
    if (entityName === 'TemplateEntity') {
      const newTemplate = newData as TemplateEntity
      const oldTemplate = oldData as TemplateEntity

      // Si estaba en DRAFT y sigue en DRAFT -> NO auditar (edición de borrador)
      if (
        oldTemplate.status === TemplateStatus.DRAFT &&
        newTemplate.status === TemplateStatus.DRAFT
      ) {
        return false
      }

      // Si cambia de estado o ya estaba publicado -> SÍ auditar
      return true
    }

    // ----------------------------------------
    // Lógica STANDARD
    // ----------------------------------------
    if (entityName === 'StandardEntity') {
      const newStandard = newData as StandardEntity
      const oldStandard = oldData as StandardEntity

      const templateId = newStandard.templateId || oldStandard.templateId
      if (!templateId) return true // Fallback por seguridad

      // Si la relación ya vino cargada (optimización)
      if (newStandard.template?.status) {
        return newStandard.template.status !== TemplateStatus.DRAFT
      }

      // Consultar estado del padre en BD
      const template = await event.manager.findOne(TemplateEntity, {
        where: { id: templateId },
        select: ['status'],
      })

      // Si el padre es DRAFT -> El hijo es borrador, NO auditar
      if (!template || template.status === TemplateStatus.DRAFT) {
        return false
      }

      return true
    }

    return true
  }
  /**
   * Calcula las diferencias entre el estado anterior y el nuevo
   */
  private calculateChanges(
    event: UpdateEvent<ObjectLiteral>,
  ): Record<string, { old: unknown; new: unknown }> {
    const changes: Record<string, { old: unknown; new: unknown }> = {}

    // Forzamos el tipado a ObjectLiteral para asegurar acceso por índice
    const oldData = event.databaseEntity as unknown as SafeData | undefined
    const newData = event.entity as unknown as SafeData | undefined

    if (!oldData || !newData) return changes

    const ignoredFields = [
      'updatedAt',
      'updatedBy',
      'deletedAt',
      'version',
      'templateId',
    ]

    event.updatedColumns.forEach((col) => {
      const key = col.propertyName
      if (ignoredFields.includes(key)) return

      // Al usar SafeData (Record<string, unknown>), el acceso ya devuelve 'unknown'
      // No necesitamos castear a 'any' ni 'unknown' aquí.
      const oldVal = oldData[key]
      const newVal = newData[key]

      if (oldVal !== newVal) {
        const cleanNew = newVal === undefined ? null : newVal
        const cleanOld = oldVal === undefined ? null : oldVal

        if (cleanOld !== cleanNew) {
          changes[key] = { old: cleanOld, new: cleanNew }
        }
      }
    })
    return changes
  }

  /**
   * Guardado de log
   */
  private async saveLog(
    event: UpdateEvent<ObjectLiteral> | SoftRemoveEvent<ObjectLiteral>,
    action: AuditAction,
    changes: Record<string, unknown> | null,
  ): Promise<void> {
    const user = this.auditService.getCurrentUser()

    // Casting seguro a la unión de tipos
    const entity = event.entity as AuditableEntity
    const oldEntity =
      'databaseEntity' in event
        ? (event.databaseEntity as AuditableEntity)
        : null

    const entityName = event.metadata.name.replace('Entity', '')

    // Determinar Root ID
    let rootId: string | undefined

    if (entityName === 'Template') {
      rootId = entity.id
    } else {
      // TypeScript necesita ayuda aquí.
      // Usamos el operador 'in' como Type Guard.
      // Esto le dice a TS: "Si 'templateId' existe en este objeto, es seguro usarlo"
      if ('templateId' in entity && typeof entity.templateId === 'string') {
        rootId = entity.templateId
      } else if (
        oldEntity &&
        'templateId' in oldEntity &&
        typeof oldEntity.templateId === 'string'
      ) {
        rootId = oldEntity.templateId
      }
    }

    if (!rootId && entityName === 'Standard') {
      this.logger.warn(
        `No se pudo determinar rootId para log de ${entityName} ${entity.id}`,
      )
      // Opcional: throw new Error(...) si quieres ser estricto
    }

    const log = new AuditLogEntity()
    log.userId = user?.userId || null
    log.userFullName = user?.fullName || 'System'
    log.userEmail = user?.email || null
    log.entity = entityName
    log.entityId = entity.id
    log.rootId = rootId || entity.id
    log.action = action
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    log.changes = changes as any

    await event.manager.save(AuditLogEntity, log)
  }
}

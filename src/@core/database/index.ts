export * from './database.module'
export * from './transaction.service'
export * from './transactional.decorator'
export * from './transaction-discovery.service'
export { ENTITY_MANAGER_KEY } from './transaction.service'
export { TRANSACTIONAL_METADATA_KEY } from './transactional.decorator'

// Persistence layer (repositories and entities registration)
// ⚠️ DO NOT export './persistence' here to avoid circular dependencies
// Import PersistenceModule directly: import { PersistenceModule } from '@core/database/persistence'

/**
 * NOTA: AuditService ahora vive en @core/context
 *
 * ❌ DEPRECADO:
 * export * from './audit.service'
 * export { CURRENT_USER_ID_KEY } from './audit.service'
 *
 * ✅ NUEVO:
 * import { AuditService, CURRENT_USER_ID_KEY } from '@core/context'
 */

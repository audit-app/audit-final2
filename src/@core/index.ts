/**
 * Barrel export para el módulo @core
 */
export * from './context' // CLS + AuditService (cross-cutting concerns)
export * from './database' // Includes persistence + TransactionService
export * from './logger'
export * from './email'
export * from './files'
export * from './http' // Cookie management + Connection metadata
export * from './repositories'
export * from './cache'

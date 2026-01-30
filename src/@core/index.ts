/**
 * Barrel export para el módulo @core
 *
 * Este archivo centraliza todos los exports de infraestructura reutilizable.
 * Importa desde '@core' en lugar de paths largos como '@core/dtos'.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Infrastructure Modules (NestJS modules)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export * from './cache' // Redis cache module
export * from './context' // CLS + AuditService (cross-cutting concerns)
export * from './database' // TypeORM + TransactionService + Persistence
export * from './email' // Email service with Handlebars templates
export * from './files' // File upload/storage with decorators
export * from './http' // HTTP utilities (decorators, guards, services)
export * from './logger' // Winston logging system
export * from './repositories' // BaseRepository with transactions
export * from './security' // Password hashing, OTP, rate limiting

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Shared Utilities (DTOs, Entities, Filters, etc.)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export * from './config' // Environment configuration (envs)
export * from './dtos' // Generic DTOs (Pagination, UUID, StandardResponse)
export * from './entities' // BaseEntity with audit fields
export * from './filters' // Global exception filters
export * from './interceptors' // Global interceptors (Audit, Logging, Transform)
export * from './swagger' // Swagger/OpenAPI helpers
export * from './utils' // Generic utilities (time, etc.)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Optional/Specialized Modules (import directly if needed)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// export * from './i18n' // i18n validation (uncomment if needed globally)
// export * from './reports' // DOCX generation (import from '@core/reports' when needed)
// export * from './testing' // Test helpers (import from '@core/testing' in tests)

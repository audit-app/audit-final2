// ============================================
// ✨ NEW: Validated Config Object (Recommended)
// ============================================
// Use this for new code - no DI, no boilerplate
export * from './envs'

// ============================================
// 🔧 LEGACY: NestJS Config Module (Deprecated)
// ============================================
// TODO: Migrate to `envs` object and remove these

// Config Module & Service
export * from './config.module'
export * from './config.service'

// Config Definitions
export * from './app.config'
export * from './auth.config'
export * from './email.config'
export * from './cache.config'
export * from './files.config'
export * from './security.config'
export * from './frontend.config'
export * from './swagger.config'
export * from './pagination.config'
export * from './database.config'

// Legacy (deprecated, use AppConfigService instead)
export * from './google.config'

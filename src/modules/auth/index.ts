/**
 * Auth Module - Barrel Export
 *
 * Exporta todos los contextos de autenticación:
 * - login: Autenticación básica (login, logout, refresh)
 * - two-factor: Autenticación de dos factores (2FA)
 * - password-reset: Recuperación de contraseña
 * - trusted-devices: Gestión de dispositivos confiables
 * - shared: Infraestructura compartida (guards, strategies, decorators, etc.)
 */

// Module
export * from './auth.module'

// ========================================
// CONTEXTS
// ========================================
export * from './login'
export * from './two-factor'
export * from './password-reset'
export * from './trusted-devices'

// ========================================
// SHARED INFRASTRUCTURE
// ========================================
// Re-exportar shared para acceso directo a guards, decorators, etc.
export * from './shared'

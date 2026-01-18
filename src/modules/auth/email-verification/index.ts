/**
 * Email Verification Context - Barrel Export
 *
 * Contexto responsable de verificación de email:
 * - Solicitar verificación de email (reenvío)
 * - Verificar email con token JWT
 *
 * ESTRATEGIA: JWT Puro (sin Redis para sesión)
 * - Token JWT válido por 7 días
 * - One-time use (se marca como usado en Redis)
 * - Throttler global es suficiente
 */

// Controllers
export * from './controllers/email-verification.controller'

// Services
export * from './services/email-verification-token.service'

// Use Cases
export * from './use-cases'

// DTOs
export * from './dtos'

// Config
export * from './config/email-verification.config'

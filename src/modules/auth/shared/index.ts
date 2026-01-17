/**
 * Shared Auth Infrastructure - Barrel Export
 *
 * Código compartido entre todos los contextos de autenticación:
 * - Guards y Strategies de Passport
 * - Decorators personalizados
 * - Helpers y utilidades
 * - Interfaces compartidas
 * - Excepciones personalizadas
 * - Políticas compartidas
 * - Configuración
 */

// Guards
export * from './guards/jwt-auth.guard'

// Strategies
export * from './strategies/jwt.strategy'
export * from './strategies/jwt-refresh.strategy'

// Decorators
export * from './decorators/public.decorator'
export * from './decorators/get-user.decorator'
export * from './decorators/get-token.decorator'

// Interfaces
export * from './interfaces/jwt-payload.interface'

// Exceptions
export * from './exceptions/too-many-attempts.exception'

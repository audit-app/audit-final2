/**
 * Response DTOs - Single Source of Truth
 *
 * Estos DTOs son el ÚNICO punto de verdad para las respuestas de la API.
 * Son usados por:
 * - Interceptors (generan la respuesta)
 * - Filters (generan errores)
 * - Swagger (documentan la API)
 * - Controllers (tipos de retorno)
 *
 * IMPORTANTE: NO duplicar estas estructuras en otros lugares.
 */

export * from './success-response.dto'
export * from './error-response.dto'
export * from './paginated-response.dto'

// Re-export PaginationMetaDto for convenience
export { PaginationMetaDto } from './paginated-response.dto'

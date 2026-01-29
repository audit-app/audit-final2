import { Role } from '../enums/role.enum'

/**
 * Payload del Access Token JWT
 *
 * Contiene información del usuario autenticado que se incluye en el token JWT.
 * Este payload se usa para:
 * - Autenticación (identificar al usuario en cada request)
 * - Autorización (verificar roles y permisos)
 * - Auditoría (tracking de acciones del usuario)
 */
export interface JwtPayload {
  /** ID del usuario (subject) */
  sub: string

  /** Email del usuario */
  email: string

  /** Username del usuario */
  username: string

  /** Roles del usuario (todos los roles asignados) */
  roles: Role[]

  /** Rol activo actual (el rol que está usando en esta sesión) */
  currentRole: Role

  /** ID de la organización a la que pertenece */
  organizationId: string

  /** Timestamp de emisión (issued at) - generado automáticamente por JWT */
  iat?: number

  /** Timestamp de expiración - generado automáticamente por JWT */
  exp?: number
}

/**
 * Payload del Refresh Token JWT
 *
 * Contiene información mínima para renovar tokens.
 * Este token es de larga duración (7 días) y se almacena en Redis.
 */
export interface JwtRefreshPayload {
  /** ID del usuario (subject) */
  sub: string

  /** ID único del token para rotation tracking */
  tokenId: string

  /** Timestamp de emisión */
  iat?: number

  /** Timestamp de expiración */
  exp?: number
}

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
  sub: string
  email: string
  username: string
  roles: Role[]
  currentRole: Role
  organizationId: string
  iat?: number
  exp?: number
}

/**
 * Payload del Refresh Token JWT
 *
 * Contiene información mínima para renovar tokens.
 * Este token es de larga duración (7 días) y se almacena en Redis.
 */
export interface JwtRefreshPayload {
  sub: string

  tokenId: string
  iat?: number

  exp?: number
}

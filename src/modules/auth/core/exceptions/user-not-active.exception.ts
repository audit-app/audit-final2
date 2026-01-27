import { UnauthorizedException } from '@nestjs/common'
import {} from '../../../users/entities/user.entity'

/**
 * Excepción lanzada cuando un usuario intenta autenticarse
 * pero su cuenta no está activa
 *
 * Se lanza cuando:
 * - El status del usuario es SUSPENDED
 * - El email no ha sido verificado (emailVerified=false)
 */
export class UserNotActiveException extends UnauthorizedException {
  constructor() {
    super(`Usuario no activo. Estado actual: INACTIVO`)
  }
}

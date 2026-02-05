import { UnauthorizedException } from '@nestjs/common'
import {} from '../../../users/entities/user.entity'

/**
 * Excepción lanzada cuando un usuario intenta autenticarse
 * pero su cuenta no está activa
 */
export class UserNotActiveException extends UnauthorizedException {
  constructor() {
    super('Usuario inhabilitado, Contacte con el administrador')
  }
}

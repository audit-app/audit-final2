import { UnauthorizedException } from '@nestjs/common'

/**
 * Excepción lanzada cuando un usuario intenta autenticarse
 * pero no ha verificado su email
 */
export class EmailNotVerifiedException extends UnauthorizedException {
  constructor() {
    super(
      'Email no verificado. Por favor verifica tu correo electrónico antes de iniciar sesión.',
    )
  }
}

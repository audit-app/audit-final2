import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import { EmailVerificationTokenService } from '../services/email-verification-token.service'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'

/**
 * Use Case: Verificar email con tokenId
 *
 * Responsabilidades:
 * - Validar tokenId (64 caracteres hex)
 * - Verificar que el token exista en Redis (no expirado)
 * - Verificar que el usuario existe
 * - Verificar que el email no esté ya verificado
 * - Marcar email como verificado
 * - Eliminar token de Redis (one-time use)
 * - Retornar mensaje de confirmación
 *
 * Seguridad:
 * - TokenId aleatorio de 256 bits (64 chars hex)
 * - Almacenado en Redis con TTL de 7 días
 * - One-time use (se elimina de Redis después de usar)
 * - Throttler global protege el endpoint
 *
 * Validaciones:
 * - TokenId existe en Redis (no expirado)
 * - Usuario existe
 * - Email del token coincide con email actual del usuario
 * - Email no verificado previamente
 *
 * Flujo:
 * 1. Validar tokenId con OtpCoreService
 * 2. Si inválido/expirado → lanzar excepción
 * 3. Buscar usuario por userId del payload
 * 4. Verificar que el usuario existe
 * 5. Verificar que el email del token coincida con el actual
 * 6. Verificar que el email no esté ya verificado
 * 7. Marcar email como verificado (emailVerified = true, emailVerifiedAt = now)
 * 8. Eliminar token de Redis (one-time use)
 * 9. Retornar mensaje de confirmación
 */
@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly emailVerificationTokenService: EmailVerificationTokenService,
  ) {}

  /**
   * Ejecuta el flujo de verificación de email
   *
   * @param token - TokenId de 64 caracteres hexadecimales
   * @returns Mensaje de confirmación
   * @throws BadRequestException si el token es inválido o el email ya está verificado
   */
  async execute(token: string): Promise<{ message: string }> {
    // 1. Validar tokenId con OtpCoreService
    const payload =
      await this.emailVerificationTokenService.validateToken(token)

    if (!payload) {
      throw new BadRequestException(
        'El token de verificación es inválido, ha expirado o ya fue usado.',
      )
    }

    // 2. Buscar usuario por userId del payload
    const user = await this.usersRepository.findById(payload.userId)

    if (!user) {
      throw new BadRequestException('Usuario no encontrado.')
    }

    // 3. Verificar que el email del token coincida con el del usuario actual
    // (el usuario podría haber cambiado su email después de recibir el token)
    if (user.email !== payload.email) {
      throw new BadRequestException(
        'El token de verificación no corresponde al email actual del usuario.',
      )
    }

    // 4. Verificar que el email no esté ya verificado
    if (user.emailVerified) {
      throw new BadRequestException('El email ya ha sido verificado.')
    }

    // 5. Marcar email como verificado
    await this.usersRepository.update(user.id, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    })

    // 6. Marcar token como usado (one-time use)
    await this.emailVerificationTokenService.markTokenAsUsed(token)

    // 7. Retornar mensaje de confirmación
    return {
      message:
        'Email verificado exitosamente. Ya puedes acceder a todas las funcionalidades.',
    }
  }
}

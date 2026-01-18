import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import { EmailVerificationTokenService } from '../services/email-verification-token.service'
import { USERS_REPOSITORY } from '../../../users/tokens'
import type { IUsersRepository } from '../../../users/repositories'

/**
 * Use Case: Verificar email con token JWT
 *
 * Responsabilidades:
 * - Validar token JWT
 * - Verificar que el token no esté usado (one-time use)
 * - Verificar que el usuario existe
 * - Verificar que el email no esté ya verificado
 * - Marcar email como verificado
 * - Marcar token como usado (one-time use)
 * - Retornar mensaje de confirmación
 *
 * Seguridad:
 * - JWT con firma diferente (EMAIL_VERIFICATION_JWT_SECRET)
 * - One-time use (se marca como usado en Redis)
 * - Expira en 7 días
 * - Throttler global protege el endpoint
 *
 * Validaciones:
 * - Token JWT válido (firma + expiración)
 * - Token no usado previamente
 * - Usuario existe
 * - Email no verificado previamente
 *
 * Flujo:
 * 1. Validar token JWT
 * 2. Si inválido/expirado/usado → lanzar excepción
 * 3. Buscar usuario por userId del payload
 * 4. Verificar que el usuario existe
 * 5. Verificar que el email no esté ya verificado
 * 6. Marcar email como verificado (emailVerified = true, emailVerifiedAt = now)
 * 7. Marcar token como usado (one-time use)
 * 8. Retornar mensaje de confirmación
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
   * @param token - Token JWT de verificación
   * @returns Mensaje de confirmación
   * @throws BadRequestException si el token es inválido o el email ya está verificado
   */
  async execute(token: string): Promise<{ message: string }> {
    // 1. Validar token JWT
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

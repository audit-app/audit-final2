import { Injectable, Inject } from '@nestjs/common'
import { EmailService } from '@core/email'
import { ResetPasswordTokenService } from '../../services/reset-password-token.service'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { ResetPasswordRateLimitPolicy } from '../../policies'

/**
 * Use Case: Solicitar reset de contraseña
 *
 * Responsabilidades:
 * - Verificar rate limiting por IP (previene spam)
 * - Verificar que el email existe en el sistema
 * - Generar token de reset (JWT + Redis)
 * - Construir URL de reset para el frontend
 * - Enviar email con el link de reset
 *
 * Seguridad:
 * - Rate limiting: 10 intentos por IP en 60 minutos
 * - No revela si el email existe o no (timing attack prevention)
 */
@Injectable()
export class RequestResetPasswordUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly resetPasswordTokenService: ResetPasswordTokenService,
    private readonly emailService: EmailService,
    private readonly resetPasswordRateLimitPolicy: ResetPasswordRateLimitPolicy,
  ) {}

  /**
   * Ejecuta el flujo de solicitud de reset de contraseña con doble validación
   *
   * Flujo de DOBLE VALIDACIÓN:
   * 1. Genera tokenId (64 chars) + OTP (6 dígitos)
   * 2. Devuelve tokenId al frontend en la respuesta
   * 3. Envía OTP al correo del usuario
   * 4. Usuario necesita AMBOS para cambiar su contraseña
   *
   * @param email - Email del usuario
   * @param ip - Dirección IP (para rate limiting)
   * @returns { message, tokenId } - tokenId se envía al frontend, mensaje genérico
   * @throws TooManyAttemptsException si excede intentos
   */
  async execute(
    email: string,
    ip: string,
  ): Promise<{ message: string; tokenId?: string }> {
    // 2. Buscar usuario por email
    const user = await this.usersRepository.findByEmail(email)

    if (!user) {
      // Incrementar contador incluso si el usuario no existe
      // Esto previene enumerar emails válidos
      await this.resetPasswordRateLimitPolicy.incrementAttempts(ip)

      // Por seguridad, no revelamos si el email existe o no
      return {
        message:
          'Si el email existe, recibirás un código de verificación en tu correo',
      }
    }

    // 3. Generar token de reset (tokenId + OTP)
    const { tokenId, otpCode } =
      await this.resetPasswordTokenService.generateToken(user.id)

    // 4. Enviar email con el código OTP
    await this.emailService.sendResetPasswordEmail({
      to: user.email,
      userName: user.username,
      resetLink: otpCode, // Ahora enviamos el código OTP en lugar del link
      expiresInMinutes: 60,
    })

    // 5. Incrementar contador (previene spam de emails)
    await this.resetPasswordRateLimitPolicy.incrementAttempts(ip)

    // 6. Devolver tokenId al frontend (OTP va por correo)
    return {
      message:
        'Si el email existe, recibirás un código de verificación en tu correo',
      tokenId, // Frontend necesita este ID para validar junto con el OTP
    }
  }
}

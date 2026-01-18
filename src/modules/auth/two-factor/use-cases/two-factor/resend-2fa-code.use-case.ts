import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { EmailService } from '@core/email'
import { TwoFactorTokenService } from '../../services/two-factor-token.service'
import { Resend2FARateLimitPolicy } from '../../policies'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'

/**
 * Use Case: Reenviar código 2FA
 *
 * Responsabilidades:
 * - Verificar cooldown de 60 segundos (rate limiting)
 * - Verificar que el usuario existe
 * - Generar nuevo código usando OtpCoreService
 * - Enviar código por email
 * - Marcar intento de resend (iniciar nuevo cooldown)
 * - Devolver nuevo tokenId
 *
 * Seguridad implementada:
 * - Cooldown: Espera 60 segundos entre resends
 * - Código expira en 5 minutos (TTL automático)
 * - One-time use (se elimina de Redis después de validar)
 * - Genera nuevo código con nueva expiración
 *
 * IMPORTANTE:
 * - El usuario puede solicitar un resend dentro de 60 segundos si no le llegó el código
 * - Cada resend genera un NUEVO tokenId (el anterior sigue válido hasta que expire)
 * - No se revocan códigos anteriores (expiran automáticamente en 5 minutos)
 *
 * Flujo:
 * 1. Verificar cooldown (lanza excepción si debe esperar)
 * 2. Buscar usuario
 * 3. Generar nuevo código OTP
 * 4. Enviar email con código
 * 5. Marcar intento de resend (cooldown de 60 segundos)
 * 6. Retornar nuevo tokenId
 */
@Injectable()
export class Resend2FACodeUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly twoFactorTokenService: TwoFactorTokenService,
    private readonly emailService: EmailService,
    private readonly resend2FARateLimitPolicy: Resend2FARateLimitPolicy,
  ) {}

  /**
   * Ejecuta el flujo de reenvío de código 2FA con cooldown
   *
   * @param userId - ID del usuario
   * @returns Nuevo tokenId y mensaje de confirmación
   * @throws NotFoundException si el usuario no existe
   * @throws TooManyAttemptsException si debe esperar cooldown
   */
  async execute(userId: string): Promise<{ token: string; message: string }> {
    // 1. RATE LIMITING: Verificar cooldown (60 segundos)
    // Lanza TooManyAttemptsException si debe esperar
    await this.resend2FARateLimitPolicy.checkCooldownOrThrow(userId)

    // 2. Buscar usuario
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    // 3. Generar nuevo código con OtpCoreService
    const { code, token } = await this.twoFactorTokenService.generateCode(
      user.id,
    )

    // 4. Enviar código por email
    await this.emailService.sendTwoFactorCode({
      to: user.email,
      userName: user.username,
      code,
      expiresInMinutes: 5,
    })

    // 5. Marcar intento de resend (iniciar cooldown de 60 segundos)
    await this.resend2FARateLimitPolicy.markResendAttempt(userId)

    // 6. Retornar nuevo tokenId
    return {
      token, // Nuevo tokenId (el anterior sigue válido hasta expirar)
      message:
        'Nuevo código 2FA enviado. Espera 60 segundos antes de solicitar otro.',
    }
  }
}

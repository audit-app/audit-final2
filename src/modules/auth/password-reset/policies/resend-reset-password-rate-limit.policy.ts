import { Injectable } from '@nestjs/common'
import { envs } from '@core/config'
import { RateLimitService } from '@core/security'
import { TooManyAttemptsException } from '../../shared'

/**
 * Policy de Rate Limiting para Resend Reset Password Code
 *
 * Implementa cooldown de 60 segundos entre resends
 * para prevenir spam de emails.
 *
 * Características:
 * - Cooldown: 60 segundos entre resends
 * - Key: `resend-reset-pw:${email}`
 * - Expiración: 60 segundos (TTL automático)
 *
 * Uso:
 * ```typescript
 * // Verificar cooldown (lanza excepción si debe esperar)
 * await policy.checkCooldownOrThrow(email)
 *
 * // Marcar intento de resend (iniciar cooldown)
 * await policy.markResendAttempt(email)
 * ```
 */
@Injectable()
export class ResendResetPasswordRateLimitPolicy {
  private readonly contextPrefix = 'reset-password-resend'
  private readonly cooldownSeconds: number

  constructor(
    private readonly rateLimitService: RateLimitService,
  ) {
    this.cooldownSeconds = envs.passwordReset.resendCooldownSeconds
  }

  async checkCooldownOrThrow(userId: string): Promise<void> {
    const key = this.getKey(userId)
    const remainingSeconds = await this.rateLimitService.getTimeUntilReset(key)

    if (remainingSeconds > 0) {
      throw new TooManyAttemptsException(
        `Debes esperar ${remainingSeconds} segundos antes de solicitar un nuevo código.`,
      )
    }
  }
  async markResendAttempt(userId: string): Promise<void> {
    const key = this.getKey(userId)

    // Incrementamos a 1 y establecemos TTL
    // La existencia de la key indica que el usuario está en cooldown
    await this.rateLimitService.incrementAttempts(
      key,
      this.cooldownSeconds / 60, // Convertir segundos a minutos
    )
  }

  /**
   * Limpia el cooldown manualmente (útil para testing)
   *
   * @param userId - ID del usuario
   */
  async clearCooldown(userId: string): Promise<void> {
    const key = this.getKey(userId)
    await this.rateLimitService.resetAttempts(key)
  }

  private getKey(userId: string): string {
    return `${this.contextPrefix}:${userId.toLowerCase().trim()}`
  }
}

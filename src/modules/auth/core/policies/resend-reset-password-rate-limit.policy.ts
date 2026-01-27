import { Injectable } from '@nestjs/common'
import { envs } from '@core/config'
import { RateLimitService } from '@core/security'
import { TooManyAttemptsException } from '../exceptions'

@Injectable()
export class ResendResetPasswordRateLimitPolicy {
  private readonly contextPrefix = 'reset-password-resend'
  private readonly cooldownSeconds = envs.passwordReset.resendCooldownSeconds

  constructor(private readonly rateLimitService: RateLimitService) {}

  private getKey(userId: string): string {
    return `${this.contextPrefix}:${userId.toLowerCase().trim()}`
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
    await this.rateLimitService.incrementAttempts(
      key,
      this.cooldownSeconds / 60,
    )
  }

  /**
   * Limpia el cooldown manualmente
   *
   * @param userId - ID del usuario
   */
  async clearCooldown(userId: string): Promise<void> {
    const key = this.getKey(userId)
    await this.rateLimitService.resetAttempts(key)
  }
}

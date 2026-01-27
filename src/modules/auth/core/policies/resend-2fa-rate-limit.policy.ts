import { Injectable } from '@nestjs/common'
import { RateLimitService } from '@core/security'
import { envs } from '@core/config'
import { TooManyAttemptsException } from '../exceptions/too-many-attempts.exception'

@Injectable()
export class Resend2FARateLimitPolicy {
  private readonly contextPrefix = '2fa-resend'
  private readonly cooldownSeconds = envs.twoFactor.resendCooldownSeconds

  constructor(private readonly rateLimitService: RateLimitService) {}

  /**
   * Construye la key compuesta para Redis
   * Resultado: rate-limit:2fa-resend:userId
   */
  private getKey(userId: string): string {
    return `${this.contextPrefix}:${userId.toLowerCase().trim()}`
  }
  /**
   * Verifica si el usuario puede solicitar un resend
   *
   * @param userId - ID del usuario
   * @throws TooManyAttemptsException si el usuario debe esperar
   */
  async checkCooldownOrThrow(userId: string): Promise<void> {
    const key = this.getKey(userId)
    const remainingSeconds = await this.rateLimitService.getTimeUntilReset(key)

    if (remainingSeconds > 0) {
      throw new TooManyAttemptsException(
        `Debes esperar ${remainingSeconds} segundos antes de solicitar un nuevo código.`,
      )
    }
  }

  /**
   * Marca que el usuario acaba de solicitar un resend
   * Crea una key en Redis con TTL de 60 segundos
   *
   * @param userId - ID del usuario
   */
  async markResendAttempt(userId: string): Promise<void> {
    const key = this.getKey(userId)
    await this.rateLimitService.incrementAttempts(key, this.cooldownSeconds)
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
}

import { Injectable } from '@nestjs/common'
import { RateLimitService } from '@core/security'
import { TooManyAttemptsException } from '../../shared/exceptions'
import { PASSWORD_RESET_CONFIG } from '../config/password-reset.config'

@Injectable()
export class ResetPasswordRateLimitPolicy {
  private readonly config = PASSWORD_RESET_CONFIG.rateLimit

  constructor(private readonly rateLimitService: RateLimitService) {}

  /**
   * Verifica el límite de intentos por IP para evitar ataques de fuerza bruta
   */
  async checkLimit(ip: string): Promise<void> {
    const key = `reset-password:ip:${ip}`
    const canAttempt = await this.rateLimitService.checkLimit(
      key,
      this.config.maxAttemptsByIp,
    )

    if (!canAttempt) {
      const remaining = await this.rateLimitService.getTimeUntilReset(key)
      throw new TooManyAttemptsException(
        `Demasiados intentos de recuperación. Intenta de nuevo en ${Math.ceil(remaining / 60)} minutos.`,
      )
    }
  }

  /**
   * Incrementa el contador de fallos
   */
  async incrementAttempts(ip: string): Promise<void> {
    const key = `reset-password:ip:${ip}`
    await this.rateLimitService.incrementAttempts(
      key,
      this.config.windowMinutes,
    )
  }

  /**
   * Resetea el contador (útil cuando el token es válido)
   */
  async resetAttempts(ip: string): Promise<void> {
    const key = `reset-password:ip:${ip}`
    await this.rateLimitService.resetAttempts(key)
  }
}

import { Injectable } from '@nestjs/common'
import { RateLimitService } from '@core/security'
import { envs } from '@core/config'
import { TooManyAttemptsException } from '../../shared/exceptions/too-many-attempts.exception'

/**
 * Política de Rate Limiting para reenvío de códigos 2FA
 *
 * Protege contra:
 * - Spam de resends
 * - Flooding de emails
 * - Abuso del endpoint de resend
 *
 * Límites:
 * - Espera 60 segundos entre cada resend (cooldown)
 *
 * Implementación simplificada: Usa RateLimitService directamente
 * para cooldown (TTL de Redis)
 *
 * Flujo:
 * 1. Usuario solicita resend
 * 2. Verificamos si existe key en Redis (rate-limit:2fa-resend:userId)
 * 3. Si existe: calcular tiempo restante y lanzar excepción
 * 4. Si no existe: permitir resend y crear key con TTL de 60 segundos
 */
@Injectable()
export class Resend2FARateLimitPolicy {
  private readonly contextPrefix = '2fa-resend'
  private readonly cooldownSeconds = envs.twoFactor.resendCooldownSeconds

  constructor(private readonly rateLimitService: RateLimitService) {}

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

    // Incrementamos a 1 y establecemos TTL
    // La existencia de la key indica que el usuario está en cooldown
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

  private getKey(userId: string): string {
    return `${this.contextPrefix}:${userId.toLowerCase().trim()}`
  }
}

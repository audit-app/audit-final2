import { Injectable } from '@nestjs/common'
import { RateLimitService } from '@core/security'
import { RATE_LIMIT_KEYS } from '../constants'
import { RATE_LIMIT_CONFIG } from '../config/rate-limit.config'
import { TooManyAttemptsException } from '../exceptions'

/**
 * Policy: Rate Limiting para operaciones de email
 *
 * Usado para:
 * - Solicitudes de reset de contraseña
 * - Verificación de email
 *
 * Responsabilidades:
 * - Prevenir spam de emails
 * - Proteger contra ataques de fuerza bruta
 * - Limitar intentos por IP
 *
 * Límites configurables:
 * - Reset password: 10 intentos por IP en 60 minutos
 * - Email verification: Similar a reset password
 *
 * NOTA: 2FA NO tiene rate limiting en generación/reenvío porque:
 * - Login ya tiene rate limiting robusto (protege el acceso inicial)
 * - Códigos expiran en 5 minutos (ventana muy corta)
 * - Validación de código usa one-time use (no se puede reutilizar)
 */
@Injectable()
export class EmailOperationRateLimitPolicy {
  constructor(private readonly rateLimitService: RateLimitService) {}

  /**
   * Verifica límite para solicitudes de reset de contraseña
   *
   * @param ip - Dirección IP del usuario
   * @throws TooManyAttemptsException si excede el límite
   */
  async checkResetPasswordLimit(ip: string): Promise<void> {
    const key = RATE_LIMIT_KEYS.RESET_PASSWORD_IP(ip)
    const config = RATE_LIMIT_CONFIG.resetPassword
    const canAttempt = await this.rateLimitService.checkLimit(
      key,
      config.maxAttemptsByIp,
      config.windowMinutes,
    )

    if (!canAttempt) {
      const remaining = await this.rateLimitService.getTimeUntilReset(key)
      throw new TooManyAttemptsException(
        `Demasiadas solicitudes de reset de contraseña. Intenta de nuevo en ${Math.ceil(remaining / 60)} minutos.`,
      )
    }
  }

  /**
   * Incrementa contador para reset de contraseña
   *
   * @param ip - Dirección IP
   */
  async incrementResetPasswordAttempt(ip: string): Promise<void> {
    const key = RATE_LIMIT_KEYS.RESET_PASSWORD_IP(ip)
    const config = RATE_LIMIT_CONFIG.resetPassword
    await this.rateLimitService.incrementAttempts(key, config.windowMinutes)
  }
}

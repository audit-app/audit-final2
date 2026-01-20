import { Injectable } from '@nestjs/common'
import { RateLimitService } from '@core/security'
import { TooManyAttemptsException } from '../../shared/exceptions/too-many-attempts.exception'
import { LOGIN_CONFIG } from '../config/login.config'

/**
 * Política de Rate Limiting para Login
 *
 * Protege contra:
 * - Ataques de fuerza bruta
 * - Credential stuffing
 * - Enumeración de usuarios
 *
 * Límites:
 * - Máximo 5 intentos fallidos por email
 * - Ventana de bloqueo: 15 minutos
 *
 * Implementación simplificada: Wrapper directo sobre RateLimitService
 * sin abstracciones innecesarias
 */
@Injectable()
export class LoginRateLimitPolicy {
  private readonly contextPrefix = 'login'
  private readonly maxAttempts = LOGIN_CONFIG.rateLimit.maxAttemptsByUser
  private readonly windowMinutes = LOGIN_CONFIG.rateLimit.windowMinutes

  constructor(private readonly rateLimitService: RateLimitService) {}

  /**
   * Construye la key compuesta para Redis
   * Resultado: rate-limit:login:user@example.com
   */
  private getKey(email: string): string {
    const normalizedEmail = email.toLowerCase().trim()
    return `${this.contextPrefix}:${normalizedEmail}`
  }

  /**
   * Verifica si el usuario puede intentar login
   * Si no puede, lanza TooManyAttemptsException
   *
   * @param email - Email del usuario
   * @throws TooManyAttemptsException si excede el límite
   */
  async checkLimitOrThrow(email: string): Promise<void> {
    const key = this.getKey(email)
    const canAttempt = await this.rateLimitService.checkLimit(
      key,
      this.maxAttempts,
    )

    if (!canAttempt) {
      const remainingSeconds =
        await this.rateLimitService.getTimeUntilReset(key)
      const minutes = Math.ceil(remainingSeconds / 60)

      throw new TooManyAttemptsException(
        `Has excedido el número de intentos de login. Inténtalo de nuevo en ${minutes} minutos.`,
      )
    }
  }

  /**
   * Registra un intento de login fallido
   *
   * @param email - Email del usuario
   */
  async registerFailure(email: string): Promise<void> {
    const key = this.getKey(email)
    await this.rateLimitService.incrementAttempts(key, this.windowMinutes)
  }

  /**
   * Limpia el historial de intentos (después de login exitoso)
   *
   * @param email - Email del usuario
   */
  async clearRecords(email: string): Promise<void> {
    const key = this.getKey(email)
    await this.rateLimitService.resetAttempts(key)
  }
}

import { Injectable } from '@nestjs/common'
import { RateLimitService } from '@core/security'
import { envs } from '@core/config'

/**
 * Política de Rate Limiting para Request Reset Password
 *
 * Protege contra:
 * - Spam de emails de reset password
 * - Enumeración de usuarios
 * - Abuso del sistema de correos
 *
 * Límites:
 * - Máximo 3 solicitudes por email cada 15 minutos
 *
 * Implementación simplificada: Wrapper directo sobre RateLimitService
 * sin abstracciones innecesarias
 *
 * IMPORTANTE: Usa patrón "Silent Drop" - no lanza excepción si excede límite,
 * solo retorna false y no envía email (para evitar enumeración de usuarios)
 */
@Injectable()
export class RequestResetPasswordRateLimitPolicy {
  private readonly contextPrefix = 'reset-password'
  private readonly maxAttempts = envs.passwordReset.maxAttemptsByEmail
  private readonly windowMinutes = envs.passwordReset.windowMinutes

  constructor(private readonly rateLimitService: RateLimitService) {}

  /**
   * Construye la key compuesta para Redis
   * Resultado: rate-limit:reset-password:user@example.com
   */
  private getKey(email: string): string {
    const normalizedEmail = email.toLowerCase().trim()
    return `${this.contextPrefix}:${normalizedEmail}`
  }

  /**
   * Verifica si el usuario puede solicitar reset password
   * NO lanza excepción (patrón Silent Drop para seguridad)
   *
   * @param email - Email del usuario
   * @returns true si puede intentar, false si está bloqueado
   */
  async canAttempt(email: string): Promise<boolean> {
    const key = this.getKey(email)
    return await this.rateLimitService.checkLimit(key, this.maxAttempts)
  }

  /**
   * Registra un intento de solicitud de reset password
   *
   * @param email - Email del usuario
   */
  async registerAttempt(email: string): Promise<void> {
    const key = this.getKey(email)
    await this.rateLimitService.incrementAttempts(key, this.windowMinutes)
  }
}

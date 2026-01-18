import { Injectable } from '@nestjs/common'
import { BaseRateLimitPolicy, RateLimitService } from '@core/security'
import { TWO_FACTOR_CONFIG } from '../config/two-factor.config'

/**
 * Política de Rate Limiting para generación de códigos 2FA
 *
 * Protege contra:
 * - Spam de generación de códigos
 * - Flooding de emails
 * - Abuso del endpoint de generación
 *
 * Límites:
 * - Máximo 5 intentos cada 15 minutos (por userId)
 *
 * Uso:
 * - Generate2FACodeUseCase
 *
 * NOTA: Usa el userId como identificador (no email) porque
 * en este punto ya sabemos quién es el usuario (viene del login)
 */
@Injectable()
export class Generate2FARateLimitPolicy extends BaseRateLimitPolicy {
  constructor(rateLimitService: RateLimitService) {
    super(
      rateLimitService,
      '2fa-generate', // Prefijo en Redis: rate-limit:2fa-generate:userId
      TWO_FACTOR_CONFIG.rateLimit.generate.maxAttempts,
      TWO_FACTOR_CONFIG.rateLimit.generate.windowMinutes,
    )
  }
}

import { Injectable } from '@nestjs/common'
import { BaseRateLimitPolicy, RateLimitService } from '@core/security'
import { PASSWORD_RESET_CONFIG } from '../config/password-reset.config'

@Injectable()
export class RequestResetPasswordRateLimitPolicy extends BaseRateLimitPolicy {
  constructor(rateLimitService: RateLimitService) {
    super(
      rateLimitService,
      'reset-password',
      PASSWORD_RESET_CONFIG.rateLimit.maxAttemptsByEmail,
      PASSWORD_RESET_CONFIG.rateLimit.windowMinutes,
    )
  }
}

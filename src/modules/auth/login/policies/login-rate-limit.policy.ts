import { Injectable } from '@nestjs/common'

import { LOGIN_CONFIG } from '../config/login.config'
import { BaseRateLimitPolicy, RateLimitService } from '@core/security'

@Injectable()
export class LoginRateLimitPolicy extends BaseRateLimitPolicy {
  constructor(rateLimitService: RateLimitService) {
    super(
      rateLimitService,
      'login',
      LOGIN_CONFIG.rateLimit.maxAttemptsByUser,
      LOGIN_CONFIG.rateLimit.windowMinutes,
    )
  }
}

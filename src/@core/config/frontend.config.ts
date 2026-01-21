import { registerAs } from '@nestjs/config'

export interface FrontendConfig {
  url: string
  verifyEmailUrl: string
  resetPasswordUrl: string
}

export const frontendConfig = registerAs(
  'frontend',
  (): FrontendConfig => ({
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
    verifyEmailUrl:
      process.env.FRONTEND_VERIFY_EMAIL_URL ||
      'http://localhost:3000/verify-email',
    resetPasswordUrl:
      process.env.FRONTEND_RESET_PASSWORD_URL ||
      'http://localhost:3000/reset-password',
  }),
)

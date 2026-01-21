import { registerAs } from '@nestjs/config'

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  from: string
  fromName: string
  testEmail: string
}

export const emailConfig = registerAs(
  'email',
  (): EmailConfig => ({
    host: process.env.MAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER || '',
    password: process.env.MAIL_PASSWORD || '',
    from: process.env.MAIL_FROM || 'noreply@audit-core.com',
    fromName: process.env.MAIL_FROM_NAME || 'Audit Core',
    testEmail: process.env.TEST_EMAIL || '',
  }),
)

import { registerAs } from '@nestjs/config'

export interface SecurityConfig {
  bcrypt: {
    rounds: number
  }
  cors: {
    origins: string[]
  }
  throttle: {
    ttl: number
    limit: number
  }
}

export const securityConfig = registerAs(
  'security',
  (): SecurityConfig => ({
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    },
    cors: {
      origins: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
        : ['http://localhost:3000'],
    },
    throttle: {
      ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
    },
  }),
)

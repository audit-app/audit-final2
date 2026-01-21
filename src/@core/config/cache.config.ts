import { registerAs } from '@nestjs/config'

export interface CacheConfig {
  redis: {
    host: string
    port: number
    password: string
    db: number
  }
}

export const cacheConfig = registerAs(
  'cache',
  (): CacheConfig => ({
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || '',
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
  }),
)

import { registerAs } from '@nestjs/config'

export interface SwaggerConfig {
  enabled: boolean
  path: string
}

export const swaggerConfig = registerAs(
  'swagger',
  (): SwaggerConfig => ({
    enabled: process.env.SWAGGER_ENABLED === 'true',
    path: process.env.SWAGGER_PATH || 'api',
  }),
)

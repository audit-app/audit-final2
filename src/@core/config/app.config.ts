import { registerAs } from '@nestjs/config'

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test' | 'staging'
  port: number
  name: string
  url: string
  isDevelopment: boolean
  isProduction: boolean
  isTest: boolean
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    name: process.env.APP_NAME || 'Audit Core',
    url: process.env.APP_URL || 'http://localhost:3000',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  }),
)

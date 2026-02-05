/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'dotenv/config' // Carga el .env automáticamente
import * as Joi from 'joi'
import {
  normalizeTime,
  normalizeTimeFromSeconds,
  normalizeTimeFromMinutes,
  normalizeTimeFromDays,
} from './time-normalizer'

/**
 * Custom Joi validator para formato de tiempo (1h, 5m, 7d)
 *
 * Este validador asegura que:
 * - JWT reciba un formato válido para jsonwebtoken (ej: "15m", "7d")
 * - Redis pueda convertir a segundos sin errores
 *
 * Formatos válidos: 30s, 5m, 1h, 7d
 */
const timeFormatValidator = Joi.string()
  .pattern(/^\d+[smhd]$/)
  .messages({
    'string.pattern.base':
      'Time format must be: <number><unit>. Examples: 30s, 5m, 1h, 7d. ' +
      'Supported units: s=seconds, m=minutes, h=hours, d=days',
  })

/**
 * Custom Joi validator flexible: acepta tanto formato de tiempo (5m) como segundos (300)
 *
 * Útil para configuraciones donde se puede especificar:
 * - Formato legible: "5m" (5 minutos)
 * - Número directo: "300" (300 segundos)
 *
 * Ambos son convertidos a segundos internamente para Redis.
 */
const flexibleTimeValidator = Joi.alternatives()
  .try(
    Joi.string().pattern(/^\d+[smhd]$/), // Formato de tiempo: 5m, 1h, 30s
    Joi.string().pattern(/^\d+$/), // Número como string: "300"
  )
  .messages({
    'alternatives.match':
      'Must be either a time format (30s, 5m, 1h, 7d) or a number in seconds (300). ' +
      'Examples: "5m" or "300"',
  })

// ========================================
// SCHEMA DE VALIDACIÓN CON JOI
// ========================================
const envVarsSchema = Joi.object({
  // ============ APP ============
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().default('Audit Core'),
  APP_URL: Joi.string().uri().default('http://localhost:3000'),

  // ============ DATABASE ============
  DATABASE_URL: Joi.string().required(),

  // ============ JWT ============
  JWT_SECRET: Joi.string().required().min(32).messages({
    'string.min': 'JWT_SECRET must be at least 32 characters for security',
    'any.required': 'JWT_SECRET is required',
  }),
  JWT_EXPIRES_IN: timeFormatValidator.default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required().min(32).messages({
    'string.min':
      'JWT_REFRESH_SECRET must be at least 32 characters for security',
    'any.required': 'JWT_REFRESH_SECRET is required',
  }),
  JWT_REFRESH_EXPIRES_IN: timeFormatValidator.default('7d'),

  // ============ TWO FACTOR AUTH ============
  TWO_FACTOR_CODE_LENGTH: Joi.number().min(4).max(8).default(6),
  TWO_FACTOR_CODE_EXPIRES_IN: flexibleTimeValidator.default('5m'),
  TRUSTED_DEVICE_TTL_DAYS: Joi.number().min(1).max(365).default(90),
  TWO_FACTOR_RESEND_COOLDOWN_SECONDS: Joi.number().min(30).default(60),
  TWO_FACTOR_VERIFY_MAX_ATTEMPTS: Joi.number().min(1).default(3),
  TWO_FACTOR_VERIFY_WINDOW_MINUTES: Joi.number().min(1).default(10),

  // ============ PASSWORD RESET ============
  RESET_PASSWORD_TOKEN_EXPIRES_IN: timeFormatValidator.default('1h'),
  MAX_RESET_PASSWORD_ATTEMPTS_EMAIL: Joi.number().min(1).default(10),
  RESET_PASSWORD_ATTEMPTS_WINDOW_MINUTES: Joi.number().min(1).default(60),

  // ============ LOGIN RATE LIMITS ============
  MAX_LOGIN_ATTEMPTS_IP: Joi.number().min(1).default(10),
  MAX_LOGIN_ATTEMPTS_USER: Joi.number().min(1).default(5),
  LOGIN_ATTEMPTS_WINDOW_MINUTES: Joi.number().min(1).default(15),

  // ============ SESSION ============
  SESSION_SECRET: Joi.string().required().min(32).messages({
    'string.min': 'SESSION_SECRET must be at least 32 characters for security',
    'any.required': 'SESSION_SECRET is required',
  }),
  SESSION_MAX_AGE: Joi.number().default(86400000), // 24h in ms
  MAX_CONCURRENT_SESSIONS_PER_USER: Joi.number().min(1).max(50).default(5), // Max refresh tokens por usuario

  // ============ DEVICE FINGERPRINT ============
  DEVICE_FINGERPRINT_SALT: Joi.string().required().min(16).messages({
    'string.min':
      'DEVICE_FINGERPRINT_SALT must be at least 16 characters for security',
    'any.required': 'DEVICE_FINGERPRINT_SALT is required',
  }),

  // ============ GOOGLE OAUTH ============
  GOOGLE_CLIENT_ID: Joi.string().allow('').default(''),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').default(''),
  GOOGLE_CALLBACK_URL: Joi.string()
    .uri()
    .default('http://localhost:3000/api/auth/google/callback'),
  DEFAULT_ORGANIZATION_ID: Joi.string().allow('', null).default(null),

  // ============ EMAIL / SMTP ============
  MAIL_HOST: Joi.string().default('smtp.ethereal.email'),
  MAIL_PORT: Joi.number().default(587),
  MAIL_SECURE: Joi.boolean().default(false),
  MAIL_USER: Joi.string().allow('').default(''),
  MAIL_PASSWORD: Joi.string().allow('').default(''),
  MAIL_FROM: Joi.string().email().default('noreply@audit-core.com'),
  MAIL_FROM_NAME: Joi.string().default('Audit Core'),
  TEST_EMAIL: Joi.string().email().allow('').default(''),

  // ============ REDIS ============
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().min(0).max(15).default(0),

  // ============ FILES / UPLOADS ============
  UPLOAD_PATH: Joi.string().default('./uploads'),
  UPLOADS_DIR: Joi.string().default('./uploads/'),
  MAX_FILE_SIZE: Joi.number().min(1024).default(10485760), // 10MB

  // ============ SECURITY ============
  BCRYPT_ROUNDS: Joi.number().min(8).max(15).default(10).messages({
    'number.min': 'BCRYPT_ROUNDS must be at least 8 for security',
    'number.max': 'BCRYPT_ROUNDS should not exceed 15 (performance impact)',
  }),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  THROTTLE_TTL: Joi.number().min(1000).default(60000), // En milisegundos
  THROTTLE_LIMIT: Joi.number().min(1).default(100),

  // ============ FRONTEND URLs ============
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
  FRONTEND_VERIFY_EMAIL_URL: Joi.string()
    .uri()
    .default('http://localhost:3000/verify-email'),
  FRONTEND_RESET_PASSWORD_URL: Joi.string()
    .uri()
    .default('http://localhost:3000/reset-password'),

  // ============ SWAGGER ============
  SWAGGER_ENABLED: Joi.boolean().default(true),
  SWAGGER_PATH: Joi.string().default('api'),

  // ============ PAGINATION ============
  DEFAULT_PAGE_SIZE: Joi.number().min(1).max(100).default(10),
  MAX_PAGE_SIZE: Joi.number().min(1).max(1000).default(100),

  // ============ LOGGING ============
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('http'),
}).unknown(true) // Permitir otras variables de entorno no listadas

// ========================================
// VALIDACIÓN (FAIL-FAST)
// ========================================
const { error, value: validatedEnv } = envVarsSchema.validate(process.env, {
  abortEarly: false, // Reportar todos los errores, no solo el primero
})

if (error) {
  const errorMessages = error.details
    .map((detail) => detail.message)
    .join('\n  - ')
  throw new Error(
    `⚠️  Environment variables validation failed:\n  - ${errorMessages}`,
  )
}

// ========================================
// OBJETO DE CONFIGURACIÓN EXPORTADO
// ========================================

const jwtRefreshExpiresIn = validatedEnv.JWT_REFRESH_EXPIRES_IN as string
const trustedDeviceDays = validatedEnv.TRUSTED_DEVICE_TTL_DAYS as number

/**
 * Configuración validada y tipada de toda la aplicación
 *
 * @example
 * ```typescript
 * import { envs } from '@core/config'
 *
 * const port = envs.app.port
 * const secret = envs.jwt.accessSecret
 * const redisHost = envs.redis.host
 * ```
 */
export const envs = {
  // ============ APP ============
  app: {
    nodeEnv: validatedEnv.NODE_ENV as
      | 'development'
      | 'production'
      | 'test'
      | 'staging',
    port: validatedEnv.PORT as number,
    name: validatedEnv.APP_NAME as string,
    url: validatedEnv.APP_URL as string,
    isDevelopment: validatedEnv.NODE_ENV === 'development',
    isProduction: validatedEnv.NODE_ENV === 'production',
    isTest: validatedEnv.NODE_ENV === 'test',
  },

  // ============ DATABASE ============
  database: {
    url: validatedEnv.DATABASE_URL as string,
  },

  // ============ JWT ============
  jwt: {
    accessSecret: validatedEnv.JWT_SECRET as string,
    accessExpires: normalizeTime(validatedEnv.JWT_EXPIRES_IN as string),
    refreshSecret: validatedEnv.JWT_REFRESH_SECRET as string,
    refreshExpires: normalizeTime(jwtRefreshExpiresIn),
  },

  // ============ TWO FACTOR AUTH ============
  twoFactor: {
    codeLength: validatedEnv.TWO_FACTOR_CODE_LENGTH as number,
    codeExpires: normalizeTime(
      validatedEnv.TWO_FACTOR_CODE_EXPIRES_IN as string,
    ),
    trustedDeviceExpires: normalizeTimeFromDays(trustedDeviceDays),
    resendCooldown: normalizeTimeFromSeconds(
      validatedEnv.TWO_FACTOR_RESEND_COOLDOWN_SECONDS as number,
    ),
    verifyMaxAttempts: validatedEnv.TWO_FACTOR_VERIFY_MAX_ATTEMPTS as number,
    verifyWindow: normalizeTimeFromMinutes(
      validatedEnv.TWO_FACTOR_VERIFY_WINDOW_MINUTES as number,
    ),
  },

  // ============ PASSWORD RESET ============
  passwordReset: {
    tokenExpires: normalizeTime(
      validatedEnv.RESET_PASSWORD_TOKEN_EXPIRES_IN as string,
    ),
    maxAttemptsByEmail:
      validatedEnv.MAX_RESET_PASSWORD_ATTEMPTS_EMAIL as number,
    window: normalizeTimeFromMinutes(
      validatedEnv.RESET_PASSWORD_ATTEMPTS_WINDOW_MINUTES as number,
    ),
    resendCooldown: normalizeTimeFromSeconds(
      validatedEnv.TWO_FACTOR_RESEND_COOLDOWN_SECONDS as number,
    ),
  },

  // ============ LOGIN RATE LIMITS ============
  login: {
    maxAttemptsByIp: validatedEnv.MAX_LOGIN_ATTEMPTS_IP as number,
    maxAttemptsByUser: validatedEnv.MAX_LOGIN_ATTEMPTS_USER as number,
    window: normalizeTimeFromMinutes(
      validatedEnv.LOGIN_ATTEMPTS_WINDOW_MINUTES as number,
    ),
  },

  // ============ SESSION ============
  session: {
    secret: validatedEnv.SESSION_SECRET as string,
    maxAge: validatedEnv.SESSION_MAX_AGE as number,
    maxConcurrentSessions:
      validatedEnv.MAX_CONCURRENT_SESSIONS_PER_USER as number,
  },

  // ============ DEVICE FINGERPRINT ============
  deviceFingerprint: {
    salt: validatedEnv.DEVICE_FINGERPRINT_SALT as string,
  },

  // ============ GOOGLE OAUTH ============
  google: {
    clientId: validatedEnv.GOOGLE_CLIENT_ID as string,
    clientSecret: validatedEnv.GOOGLE_CLIENT_SECRET as string,
    callbackUrl: validatedEnv.GOOGLE_CALLBACK_URL as string,
    defaultOrganizationId: validatedEnv.DEFAULT_ORGANIZATION_ID as
      | string
      | null,
  },

  // ============ EMAIL / SMTP ============
  email: {
    host: validatedEnv.MAIL_HOST as string,
    port: validatedEnv.MAIL_PORT as number,
    secure: validatedEnv.MAIL_SECURE as boolean,
    user: validatedEnv.MAIL_USER as string,
    password: validatedEnv.MAIL_PASSWORD as string,
    from: validatedEnv.MAIL_FROM as string,
    fromName: validatedEnv.MAIL_FROM_NAME as string,
    testEmail: validatedEnv.TEST_EMAIL as string,
  },

  // ============ REDIS ============
  redis: {
    host: validatedEnv.REDIS_HOST as string,
    port: validatedEnv.REDIS_PORT as number,
    password: validatedEnv.REDIS_PASSWORD as string,
    db: validatedEnv.REDIS_DB as number,
  },

  // ============ FILES / UPLOADS ============
  files: {
    uploadPath: validatedEnv.UPLOAD_PATH as string,
    uploadsDir: validatedEnv.UPLOADS_DIR as string,
    maxFileSize: validatedEnv.MAX_FILE_SIZE as number,
  },

  // ============ SECURITY ============
  security: {
    bcryptRounds: validatedEnv.BCRYPT_ROUNDS as number,
    corsOrigins: (validatedEnv.CORS_ORIGIN as string)
      .split(',')
      .map((origin) => origin.trim()),
    throttleTtl: validatedEnv.THROTTLE_TTL as number,
    throttleLimit: validatedEnv.THROTTLE_LIMIT as number,
  },

  // ============ FRONTEND URLs ============
  frontend: {
    url: validatedEnv.FRONTEND_URL as string,
    verifyEmailUrl: validatedEnv.FRONTEND_VERIFY_EMAIL_URL as string,
    resetPasswordUrl: validatedEnv.FRONTEND_RESET_PASSWORD_URL as string,
  },

  // ============ SWAGGER ============
  swagger: {
    enabled: validatedEnv.SWAGGER_ENABLED as boolean,
    path: validatedEnv.SWAGGER_PATH as string,
  },

  // ============ PAGINATION ============
  pagination: {
    defaultPageSize: validatedEnv.DEFAULT_PAGE_SIZE as number,
    maxPageSize: validatedEnv.MAX_PAGE_SIZE as number,
  },

  // ============ LOGGING ============
  log: {
    level: validatedEnv.LOG_LEVEL as string,
  },
} as const // ← Hacer readonly

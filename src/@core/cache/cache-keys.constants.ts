/**
 * Constantes para llaves de Redis
 *
 * ESTÁNDAR UNIFICADO:
 * ====================
 *
 * 1. TOKENS/STORAGE (usan prefijos completos)
 *    Formato: auth:{feature}:{token} o auth:{feature}:{userId}:{tokenId}
 *    - Tokens simples: auth:reset-pw:{token}
 *    - Tokens por usuario: auth:refresh:{userId}:{tokenId}
 *
 * 2. RATE LIMITING (NO incluir prefijo "rate-limit:")
 *    Formato: {feature}:{limitType}:{identifier}
 *    - RateLimitService agrega "rate-limit:" automáticamente
 *    - Ejemplo: login:ip:127.0.0.1 → rate-limit:login:ip:127.0.0.1
 *
 * IMPORTANTE: Este estándar previene errores de duplicación de prefijos
 */

export const REDIS_PREFIXES = {
  REFRESH_TOKEN: 'auth:refresh',
  BLACKLIST: 'auth:blacklist',
  RESET_PASSWORD: 'auth:reset-pw',
  TWO_FACTOR: 'auth:2fa',
  EMAIL_VERIFICATION: 'auth:verify-email',
  RATE_LIMIT: 'rate-limit', // Solo para referencia, no usar directamente
} as const

export type RedisPrefix = (typeof REDIS_PREFIXES)[keyof typeof REDIS_PREFIXES]

export const CACHE_KEYS = {
  // ========================================
  // TOKENS / STORAGE
  // ========================================

  /**
   * Refresh Tokens
   * Key: auth:refresh:{userId}:{tokenId}
   * Value: "1" (existence check)
   */
  REFRESH_TOKEN: (userId: string, tokenId: string) =>
    `${REDIS_PREFIXES.REFRESH_TOKEN}:${userId}:${tokenId}`,

  /**
   * Blacklist (access tokens revocados)
   * Key: auth:blacklist:{token}
   * Value: "1"
   */
  BLACKLIST: (token: string) => `${REDIS_PREFIXES.BLACKLIST}:${token}`,

  /**
   * Reset Password Tokens (SIMPLIFICADO - sin JWT)
   * Key: auth:reset-pw:{token}
   * Value: {userId}
   * TTL: 1 hora
   */
  RESET_PASSWORD: (token: string) =>
    `${REDIS_PREFIXES.RESET_PASSWORD}:${token}`,

  /**
   * Two-Factor Authentication Codes (SIMPLIFICADO - sin JWT)
   * Key: auth:2fa:{token}
   * Value: JSON {userId, code}
   * TTL: 5 minutos
   */
  TWO_FACTOR: (token: string) => `${REDIS_PREFIXES.TWO_FACTOR}:${token}`,

  /**
   * Email Verification Tokens
   * Key: auth:verify-email:{userId}:{tokenId}
   * Value: "1"
   */
  EMAIL_VERIFICATION: (userId: string, tokenId: string) =>
    `${REDIS_PREFIXES.EMAIL_VERIFICATION}:${userId}:${tokenId}`,

  /**
   * Patrones para búsqueda con wildcards
   * Usado para listar o eliminar múltiples keys
   */
  USER_SESSIONS: (userId: string) =>
    `${REDIS_PREFIXES.REFRESH_TOKEN}:${userId}:*`,
  USER_RESET_TOKENS: (userId: string) =>
    `${REDIS_PREFIXES.RESET_PASSWORD}:${userId}:*`,
  USER_EMAIL_VERIFICATION_TOKENS: (userId: string) =>
    `${REDIS_PREFIXES.EMAIL_VERIFICATION}:${userId}:*`,

  // ========================================
  // RATE LIMITING
  // ========================================
  // IMPORTANTE: RateLimitService agrega "rate-limit:" automáticamente
  // NO duplicar el prefijo aquí
  //
  // Formato: {feature}:{limitType}:{identifier}
  // - feature: login, reset-password, 2fa-generate, 2fa-verify
  // - limitType: ip, user, token
  // - identifier: valor específico (IP, email, userId, token)
  //
  // Resultado final: rate-limit:{feature}:{limitType}:{identifier}
  // ========================================

  /**
   * Login Rate Limiting por IP
   * Key: rate-limit:login:ip:{ip}
   * Límite: 10 intentos en 15 minutos
   */
  LOGIN_ATTEMPTS_IP: (ip: string) => `login:ip:${ip}`,

  /**
   * Login Rate Limiting por Usuario
   * Key: rate-limit:login:user:{email}
   * Límite: 5 intentos en 15 minutos
   */
  LOGIN_ATTEMPTS_USER: (userIdentifier: string) =>
    `login:user:${userIdentifier.toLowerCase()}`,

  /**
   * Reset Password Rate Limiting por IP
   * Key: rate-limit:reset-password:ip:{ip}
   * Límite: 10 intentos en 60 minutos
   */
  RESET_PASSWORD_ATTEMPTS_IP: (ip: string) => `reset-password:ip:${ip}`,

  /**
   * 2FA Generate Rate Limiting por Usuario
   * Key: rate-limit:2fa-generate:user:{userId}
   * Límite: 5 intentos en 5 minutos
   */
  TWO_FACTOR_GENERATE_ATTEMPTS: (userId: string) =>
    `2fa-generate:user:${userId}`,

  /**
   * 2FA Verify Rate Limiting por Token
   * Key: rate-limit:2fa-verify:token:{token}
   * Límite: 5 intentos en 5 minutos
   */
  TWO_FACTOR_VERIFY_ATTEMPTS: (token: string) => `2fa-verify:token:${token}`,
} as const

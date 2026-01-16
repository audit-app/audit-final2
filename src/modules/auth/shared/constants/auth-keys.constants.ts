/**
 * Constantes de llaves Redis para autenticación y seguridad
 *
 * ESTÁNDAR DE LLAVES:
 * ===================
 * Formato: auth:{feature}:{identifier}
 *
 * Tipos de llaves:
 * 1. Tokens con userId y tokenId: auth:{feature}:{userId}:{tokenId}
 * 2. Tokens simples: auth:{feature}:{token}
 * 3. Dispositivos confiables: auth:trusted-device:{userId}:{fingerprint}
 * 4. Blacklist: auth:blacklist:{token}
 */

/**
 * Prefijos para categorías de llaves
 */
export const AUTH_PREFIXES = {
  REFRESH_TOKEN: 'auth:refresh',
  BLACKLIST: 'auth:blacklist',
  RESET_PASSWORD: 'auth:reset-pw',
  TWO_FACTOR: 'auth:2fa',
  EMAIL_VERIFICATION: 'auth:verify-email',
  TRUSTED_DEVICE: 'auth:trusted-device',
} as const

export type AuthPrefix = (typeof AUTH_PREFIXES)[keyof typeof AUTH_PREFIXES]

/**
 * Llaves de autenticación para Redis
 */
export const AUTH_KEYS = {
  // ========================================
  // REFRESH TOKENS
  // ========================================

  /**
   * Refresh Tokens
   * Key: auth:refresh:{userId}:{tokenId}
   * Value: JSON {tokenId, userId, createdAt, metadata}
   * TTL: 7 días (configurable via JWT_REFRESH_EXPIRES_IN)
   */
  REFRESH_TOKEN: (userId: string, tokenId: string) =>
    `${AUTH_PREFIXES.REFRESH_TOKEN}:${userId}:${tokenId}`,

  /**
   * Patrón para buscar todos los refresh tokens de un usuario
   */
  USER_REFRESH_TOKENS: (userId: string) =>
    `${AUTH_PREFIXES.REFRESH_TOKEN}:${userId}:*`,

  // ========================================
  // BLACKLIST (Access Tokens Revocados)
  // ========================================

  /**
   * Blacklist de access tokens revocados
   * Key: auth:blacklist:{token}
   * Value: userId (para auditoría)
   * TTL: Tiempo restante hasta expiración del access token
   */
  BLACKLIST: (token: string) => `${AUTH_PREFIXES.BLACKLIST}:${token}`,

  // ========================================
  // RESET PASSWORD TOKENS
  // ========================================

  /**
   * Reset Password Tokens (sin JWT, solo Redis)
   * Key: auth:reset-pw:{token}
   * Value: userId
   * TTL: 1 hora (configurable via RESET_PASSWORD_TOKEN_EXPIRES_IN)
   *
   * El token es un string aleatorio de 64 caracteres hex (256 bits)
   */
  RESET_PASSWORD: (token: string) =>
    `${AUTH_PREFIXES.RESET_PASSWORD}:${token}`,

  /**
   * Patrón para buscar todos los tokens de reset password
   * Usado para revocar todos los tokens de un usuario
   */
  ALL_RESET_PASSWORD_TOKENS: () => `${AUTH_PREFIXES.RESET_PASSWORD}:*`,

  // ========================================
  // TWO-FACTOR AUTHENTICATION (2FA)
  // ========================================

  /**
   * Two-Factor Authentication Codes (sin JWT, solo Redis)
   * Key: auth:2fa:{token}
   * Value: JSON {userId, code}
   * TTL: 5 minutos (configurable via TWO_FACTOR_CODE_EXPIRES_IN)
   *
   * El token es un string aleatorio de 64 caracteres hex (256 bits)
   * El code es un número de 6 dígitos
   */
  TWO_FACTOR: (token: string) => `${AUTH_PREFIXES.TWO_FACTOR}:${token}`,

  // ========================================
  // EMAIL VERIFICATION
  // ========================================

  /**
   * Email Verification Tokens
   * Key: auth:verify-email:{userId}:{tokenId}
   * Value: JSON {tokenId, userId, createdAt}
   * TTL: 24 horas (configurable)
   */
  EMAIL_VERIFICATION: (userId: string, tokenId: string) =>
    `${AUTH_PREFIXES.EMAIL_VERIFICATION}:${userId}:${tokenId}`,

  /**
   * Patrón para buscar todos los tokens de verificación de un usuario
   */
  USER_EMAIL_VERIFICATION_TOKENS: (userId: string) =>
    `${AUTH_PREFIXES.EMAIL_VERIFICATION}:${userId}:*`,

  // ========================================
  // TRUSTED DEVICES (Dispositivos Confiables)
  // ========================================

  /**
   * Trusted Devices (Dispositivos Confiables)
   * Key: auth:trusted-device:{userId}:{deviceFingerprint}
   * Value: JSON {browser, os, device, ip, createdAt, lastUsedAt}
   * TTL: 90 días (configurable via TRUSTED_DEVICE_TTL_DAYS)
   *
   * El fingerprint es SHA-256 de (User-Agent + IP + salt)
   * Permite bypass automático de 2FA para dispositivos conocidos
   */
  TRUSTED_DEVICE: (userId: string, deviceFingerprint: string) =>
    `${AUTH_PREFIXES.TRUSTED_DEVICE}:${userId}:${deviceFingerprint}`,

  /**
   * Patrón para buscar todos los dispositivos confiables de un usuario
   */
  USER_TRUSTED_DEVICES: (userId: string) =>
    `${AUTH_PREFIXES.TRUSTED_DEVICE}:${userId}:*`,
} as const

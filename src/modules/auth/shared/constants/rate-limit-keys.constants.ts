/**
 * Constantes de llaves Redis para Rate Limiting
 *
 * IMPORTANTE: RateLimitService agrega el prefijo "rate-limit:" automáticamente
 * NO incluir "rate-limit:" en estas funciones
 *
 * FORMATO:
 * ========
 * Input: {feature}:{limitType}:{identifier}
 * Output en Redis: rate-limit:{feature}:{limitType}:{identifier}
 *
 * Donde:
 * - feature: login, reset-password, email-operation, etc.
 * - limitType: ip, user, token, email, etc.
 * - identifier: valor específico (IP, email, userId, token)
 *
 * Ejemplo:
 * - Función retorna: "login:ip:127.0.0.1"
 * - RateLimitService almacena: "rate-limit:login:ip:127.0.0.1"
 *
 * PRECAUCIÓN: Este estándar previene errores de duplicación de prefijos
 */

/**
 * Llaves de Rate Limiting para Redis
 *
 * NOTA: Todas estas keys son procesadas por RateLimitService que agrega
 * el prefijo "rate-limit:" automáticamente
 */
export const RATE_LIMIT_KEYS = {
  // ========================================
  // LOGIN RATE LIMITING
  // ========================================

  /**
   * Login Rate Limiting por IP
   * Key final: rate-limit:login:ip:{ip}
   * Límite: 10 intentos en 15 minutos (configurable)
   *
   * Previene ataques de fuerza bruta distribuidos desde una IP
   */
  LOGIN_IP: (ip: string) => `login:ip:${ip}`,

  /**
   * Login Rate Limiting por Usuario
   * Key final: rate-limit:login:user:{email}
   * Límite: 5 intentos en 15 minutos (configurable)
   *
   * Previene ataques dirigidos a cuentas específicas
   * El identifier se normaliza a lowercase automáticamente
   */
  LOGIN_USER: (userIdentifier: string) =>
    `login:user:${userIdentifier.toLowerCase()}`,

  // ========================================
  // RESET PASSWORD RATE LIMITING
  // ========================================

  /**
   * Reset Password Rate Limiting por IP
   * Key final: rate-limit:reset-password:ip:{ip}
   * Límite: 10 intentos en 60 minutos (configurable)
   *
   * Previene abuso de la funcionalidad de reset password
   */
  RESET_PASSWORD_IP: (ip: string) => `reset-password:ip:${ip}`,

  // ========================================
  // EMAIL OPERATIONS RATE LIMITING
  // ========================================

  /**
   * Email Operations Rate Limiting (genérico)
   * Key final: rate-limit:email:{operation}:{identifier}
   * Límite: Configurable según operación
   *
   * Previene spam de emails (verificación, 2FA, reset password, etc.)
   *
   * @param operation - Tipo de operación: 'verify', '2fa', 'reset-password', etc.
   * @param identifier - Email o userId
   */
  EMAIL_OPERATION: (operation: string, identifier: string) =>
    `email:${operation}:${identifier.toLowerCase()}`,

  /**
   * Email Verification Rate Limiting
   * Key final: rate-limit:email:verify:{email}
   */
  EMAIL_VERIFICATION: (email: string) =>
    RATE_LIMIT_KEYS.EMAIL_OPERATION('verify', email),

  /**
   * 2FA Email Rate Limiting
   * Key final: rate-limit:email:2fa:{email}
   */
  EMAIL_2FA: (email: string) => RATE_LIMIT_KEYS.EMAIL_OPERATION('2fa', email),

  /**
   * Reset Password Email Rate Limiting
   * Key final: rate-limit:email:reset-password:{email}
   */
  EMAIL_RESET_PASSWORD: (email: string) =>
    RATE_LIMIT_KEYS.EMAIL_OPERATION('reset-password', email),
} as const

/**
 * NOTA SOBRE 2FA RATE LIMITING:
 * ==============================
 * 2FA NO tiene rate limiting de validación de códigos porque:
 * - Login ya tiene rate limiting robusto (5 intentos/15min por usuario)
 * - Códigos expiran en 5 minutos (ventana muy corta)
 * - Validación usa one-time use (no se puede reutilizar)
 * - Dispositivos confiables reducen frecuencia de 2FA
 *
 * Keys eliminadas:
 * - TWO_FACTOR_GENERATE_ATTEMPTS (antes: 2fa-generate:user:{userId})
 * - TWO_FACTOR_VERIFY_ATTEMPTS (antes: 2fa-verify:token:{token})
 */

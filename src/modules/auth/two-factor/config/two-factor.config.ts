/**
 * Configuración de Two-Factor Authentication (2FA)
 *
 * Variables de entorno:
 * - TWO_FACTOR_CODE_LENGTH: Longitud del código numérico (default: 6)
 * - TWO_FACTOR_CODE_EXPIRES_IN: Tiempo de expiración en segundos (default: 300 = 5 minutos)
 *
 * Rate Limiting:
 * - TWO_FACTOR_GENERATE_MAX_ATTEMPTS: Intentos máximos para generar código (default: 5)
 * - TWO_FACTOR_GENERATE_WINDOW_MINUTES: Ventana de tiempo para generación (default: 15)
 * - TWO_FACTOR_RESEND_COOLDOWN_SECONDS: Tiempo de espera entre resends (default: 60)
 * - TWO_FACTOR_VERIFY_MAX_ATTEMPTS: Intentos máximos de verificación (default: 3)
 *
 * IMPORTANTE: El sistema usa OtpCoreService y rate limiting robusto:
 * - Generación: Máximo 5 códigos cada 15 minutos
 * - Resend: Espera 60 segundos entre solicitudes
 * - Verificación: Máximo 3 intentos, luego se revoca el token
 */
export const TWO_FACTOR_CONFIG = {
  code: {
    length: parseInt(process.env.TWO_FACTOR_CODE_LENGTH || '6', 10),
    expiresIn: parseInt(process.env.TWO_FACTOR_CODE_EXPIRES_IN || '300', 10), // 5 minutos en segundos
  },
  rateLimit: {
    // Límite para generar códigos (evita spam)
    generate: {
      maxAttempts: parseInt(
        process.env.TWO_FACTOR_GENERATE_MAX_ATTEMPTS || '5',
        10,
      ),
      windowMinutes: parseInt(
        process.env.TWO_FACTOR_GENERATE_WINDOW_MINUTES || '15',
        10,
      ),
    },
    // Límite para resend (evita spam de emails)
    resend: {
      cooldownSeconds: parseInt(
        process.env.TWO_FACTOR_RESEND_COOLDOWN_SECONDS || '60',
        10,
      ),
    },
    // Límite para verificación (seguridad contra brute force)
    verify: {
      maxAttempts: parseInt(
        process.env.TWO_FACTOR_VERIFY_MAX_ATTEMPTS || '3',
        10,
      ),
      windowMinutes: 15, // Ventana de tiempo para intentos de verificación
    },
  },
} as const

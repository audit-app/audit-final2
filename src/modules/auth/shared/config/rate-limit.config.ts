/**
 * Configuración centralizada de Rate Limiting para Auth
 *
 * Todas las configuraciones se pueden sobrescribir via variables de entorno
 * con valores por defecto seguros
 *
 * NOTA: Rate limiting de 2FA fue ELIMINADO porque:
 * - Login ya tiene rate limiting robusto (5 intentos/15min por usuario)
 * - Códigos 2FA expiran en 5 minutos (ventana muy corta)
 * - Validación usa one-time use (no se puede reutilizar)
 * - Dispositivos confiables reducen frecuencia de 2FA
 */

export const RATE_LIMIT_CONFIG = {
  login: {
    maxAttemptsByIp: parseInt(process.env.MAX_LOGIN_ATTEMPTS_IP || '10', 10),
    maxAttemptsByUser: parseInt(process.env.MAX_LOGIN_ATTEMPTS_USER || '5', 10),
    windowMinutes: parseInt(
      process.env.LOGIN_ATTEMPTS_WINDOW_MINUTES || '15',
      10,
    ),
  },
  resetPassword: {
    maxAttemptsByIp: parseInt(
      process.env.MAX_RESET_PASSWORD_ATTEMPTS_IP || '10',
      10,
    ),
    windowMinutes: parseInt(
      process.env.RESET_PASSWORD_ATTEMPTS_WINDOW_MINUTES || '60',
      10,
    ),
  },
} as const

/**
 * Configuración de Password Reset
 *
 * Variables de entorno:
 * - MAX_RESET_PASSWORD_ATTEMPTS_IP: Máximo de intentos por IP (default: 10)
 * - RESET_PASSWORD_ATTEMPTS_WINDOW_MINUTES: Ventana de tiempo en minutos (default: 60)
 */
export const PASSWORD_RESET_CONFIG = {
  rateLimit: {
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

/**
 * Configuración de Login
 *
 * Variables de entorno:
 *
 * Rate Limiting:
 * - MAX_LOGIN_ATTEMPTS_IP: Máximo de intentos por IP (default: 10)
 * - MAX_LOGIN_ATTEMPTS_USER: Máximo de intentos por usuario (default: 5)
 * - LOGIN_ATTEMPTS_WINDOW_MINUTES: Ventana de tiempo en minutos (default: 15)
 *
 * JWT:
 * - JWT_ACCESS_SECRET: Secret para firmar access tokens (REQUERIDO)
 * - JWT_REFRESH_SECRET: Secret para firmar refresh tokens (REQUERIDO)
 * - JWT_EXPIRES_IN: Tiempo de expiración de access tokens (default: '15m')
 * - JWT_REFRESH_EXPIRES_IN: Tiempo de expiración de refresh tokens (default: '7d')
 */
export const LOGIN_CONFIG = {
  rateLimit: {
    maxAttemptsByIp: parseInt(process.env.MAX_LOGIN_ATTEMPTS_IP || '10', 10),
    maxAttemptsByUser: parseInt(process.env.MAX_LOGIN_ATTEMPTS_USER || '5', 10),
    windowMinutes: parseInt(
      process.env.LOGIN_ATTEMPTS_WINDOW_MINUTES || '15',
      10,
    ),
  },
  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET || '',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET || '',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
  },
} as const

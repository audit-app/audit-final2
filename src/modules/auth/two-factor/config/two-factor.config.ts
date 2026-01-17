/**
 * Configuración de Two-Factor Authentication (2FA)
 *
 * Variables de entorno:
 * - TWO_FACTOR_CODE_LENGTH: Longitud del código numérico (default: 6)
 * - TWO_FACTOR_CODE_EXPIRES_IN: Tiempo de expiración (default: '5m')
 * - TWO_FACTOR_JWT_SECRET: Secret para firmar JWTs de 2FA (REQUERIDO)
 *
 * NOTA: Rate limiting de 2FA fue ELIMINADO porque:
 * - Login ya tiene rate limiting robusto (5 intentos/15min por usuario)
 * - Códigos 2FA expiran en 5 minutos (ventana muy corta)
 * - Validación usa one-time use (no se puede reutilizar)
 * - Dispositivos confiables reducen frecuencia de 2FA
 */
export const TWO_FACTOR_CONFIG = {
  code: {
    length: parseInt(process.env.TWO_FACTOR_CODE_LENGTH || '6', 10),
    expiresIn: process.env.TWO_FACTOR_CODE_EXPIRES_IN || '5m',
  },
  jwt: {
    secret: process.env.TWO_FACTOR_JWT_SECRET || '',
  },
} as const

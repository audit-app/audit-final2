/**
 * Validación de códigos 2FA (Two-Factor Authentication)
 *
 * Estos son códigos numéricos temporales enviados por email
 * Usado para verificación adicional de identidad
 */

export const TWO_FACTOR_CONSTRAINTS = {
  CODE: {
    LENGTH: 6,
    PATTERN: /^\d{6}$/,
    MESSAGE: 'El código debe tener exactamente 6 dígitos numéricos',
  },

  TOKEN: {
    MIN: 10,
    MAX: 1000,
  },

  IDENTIFIER: {
    MAX: 255,
    MESSAGE: 'El email o ID de usuario es requerido',
  },
}

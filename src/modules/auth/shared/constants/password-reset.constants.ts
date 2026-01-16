/**
 * Validación de contraseñas para Reset Password
 *
 */

export const PASSWORD_RESET_CONSTRAINTS = {
  /**
   * Requisitos de contraseña para reset
   *
   * - Mínimo 8 caracteres
   * - Máximo 128 caracteres (protección contra DoS)
   * - Al menos una mayúscula
   * - Al menos una minúscula
   * - Al menos un número
   * - Al menos un carácter especial
   */
  PASSWORD: {
    MIN: 8,
    MAX: 128,
    PATTERN:
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]+$/,
    MESSAGE:
      'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
  },

  TOKEN: {
    MIN: 10,
    MAX: 1000,
  },
}

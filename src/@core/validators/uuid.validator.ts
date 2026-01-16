/**
 * Validador de UUID v4
 *
 * Centraliza la lógica de validación de UUID para evitar duplicación.
 * Usado en use-cases que aceptan tanto email como UUID.
 */
export class UuidValidator {
  private static readonly UUID_V4_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  /**
   * Valida si una cadena es un UUID v4 válido
   * @param str - Cadena a validar
   * @returns true si es un UUID v4 válido
   */
  static isValid(str: string): boolean {
    return this.UUID_V4_REGEX.test(str)
  }
}

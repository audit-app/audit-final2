import ms, { StringValue } from 'ms'

/**
 * Utilidades para manejo de tiempos y conversiones
 */
export class TimeUtil {
  /**
   * Convierte un string de tiempo (ej: "1h", "15m") a segundos.
   * Ideal para TTL de Redis.
   */
  static toSeconds(
    time: string | number | undefined,
    defaultSeconds = 0,
  ): number {
    if (!time) return defaultSeconds

    try {
      if (typeof time === 'number') return Math.floor(time / 1000)

      // ms() devuelve milisegundos (number) o undefined si el formato es inválido
      const milliseconds = ms(time as StringValue)

      return typeof milliseconds === 'number'
        ? Math.floor(milliseconds / 1000)
        : defaultSeconds
    } catch {
      return defaultSeconds
    }
  }

  /**
   * Convierte un string a milisegundos.
   * Ideal para Cookies o setTimeouts.
   */
  static toMilliseconds(time: string | number | undefined): number {
    if (!time) return 0
    if (typeof time === 'number') return time

    try {
      return ms(time as StringValue) || 0
    } catch {
      return 0
    }
  }

  /**
   * Genera una fecha futura (Date) sumando el tiempo a "ahora".
   */
  static getFutureDate(time: string | number): Date {
    return new Date(Date.now() + this.toMilliseconds(time))
  }
}

import ms from 'ms'

/**
 * Objeto normalizado de tiempo con todas las unidades posibles
 *
 * @property raw - Formato original (para JWT y librerías que esperan strings: "1d", "5m")
 * @property ms - Milisegundos (para cookies, setTimeout, Date operations)
 * @property seconds - Segundos (para Redis TTL, rate limiting)
 * @property minutes - Minutos (para display en UI o logs)
 *
 * @example
 * const time = normalizeTime("7d")
 * // {
 * //   raw: "7d",
 * //   ms: 604800000,
 * //   seconds: 604800,
 * //   minutes: 10080
 * // }
 */
export interface NormalizedTime {
  /** String original: "1d", "5m", "30s" - para JWT y librerías externas */
  raw: string

  /** Milisegundos - para cookies, setTimeout, Date operations */
  ms: number

  /** Segundos - para Redis TTL, rate limiting */
  seconds: number

  /** Minutos - para display en UI, emails, logs */
  minutes: number
}

/**
 * Normaliza una cadena de tiempo a todas las unidades posibles
 *
 * Esta función elimina la ambigüedad de unidades de tiempo en el sistema:
 * - JWT espera strings como "15m", "7d"
 * - Redis TTL espera segundos
 * - Cookies y setTimeout esperan milisegundos
 * - UI muestra minutos/horas legibles
 *
 * Al normalizar TODO en un solo lugar, evitamos bugs de conversión.
 *
 * @param timeStr - String en formato: "30s", "5m", "1h", "7d", "2w"
 * @returns Objeto con todas las unidades de tiempo
 * @throws Error si el formato es inválido
 *
 * @example
 * // Para JWT (usa el string original)
 * jwt.sign(payload, secret, { expiresIn: normalizeTime("7d").raw })
 *
 * @example
 * // Para Redis TTL (usa segundos)
 * await redis.set(key, value, normalizeTime("5m").seconds)
 *
 * @example
 * // Para cookies (usa milisegundos)
 * res.cookie('token', value, { maxAge: normalizeTime("1h").ms })
 *
 * @example
 * // Para emails/UI (usa minutos legibles)
 * const msg = `El código expira en ${normalizeTime("5m").minutes} minutos`
 */
export function normalizeTime(timeStr: string): NormalizedTime {
  // Validar que ms() pueda parsear el formato
  const milliseconds = ms(timeStr as ms.StringValue)

  if (!milliseconds || milliseconds <= 0) {
    throw new Error(
      `Invalid time format: "${timeStr}". ` +
        `Expected formats: "30s", "5m", "1h", "7d", "2w". ` +
        `Examples: ms("5m") → 300000ms, ms("1d") → 86400000ms. ` +
        `See: https://github.com/vercel/ms`,
    )
  }

  // Validación: evitar valores extremos (más de 1 año)
  const oneYearMs = 365 * 24 * 60 * 60 * 1000
  if (milliseconds > oneYearMs) {
    throw new Error(
      `Time value too large: "${timeStr}" (${milliseconds}ms). ` +
        `Maximum allowed: 365d (1 year). ` +
        `This prevents accidental infinite TTLs.`,
    )
  }

  return {
    raw: timeStr,
    ms: milliseconds,
    seconds: Math.floor(milliseconds / 1000),
    minutes: Math.floor(milliseconds / (1000 * 60)),
  }
}

/**
 * Normaliza un número (en segundos) a un objeto de tiempo
 *
 * Útil cuando la config viene como número directo en lugar de string.
 * Por ejemplo: TWO_FACTOR_RESEND_COOLDOWN_SECONDS=60
 *
 * @param seconds - Número de segundos
 * @returns Objeto con todas las unidades de tiempo
 *
 * @example
 * const cooldown = normalizeTimeFromSeconds(60)
 * // {
 * //   raw: "60s",
 * //   ms: 60000,
 * //   seconds: 60,
 * //   minutes: 1
 * // }
 */
export function normalizeTimeFromSeconds(seconds: number): NormalizedTime {
  if (!Number.isInteger(seconds) || seconds <= 0) {
    throw new Error(
      `Invalid seconds value: ${seconds}. Must be a positive integer.`,
    )
  }

  const milliseconds = seconds * 1000

  return {
    raw: `${seconds}s`,
    ms: milliseconds,
    seconds: seconds,
    minutes: Math.floor(seconds / 60),
  }
}

/**
 * Normaliza un número (en minutos) a un objeto de tiempo
 *
 * Útil para configs que vienen en minutos.
 * Por ejemplo: LOGIN_ATTEMPTS_WINDOW_MINUTES=15
 *
 * @param minutes - Número de minutos
 * @returns Objeto con todas las unidades de tiempo
 *
 * @example
 * const window = normalizeTimeFromMinutes(15)
 * // {
 * //   raw: "15m",
 * //   ms: 900000,
 * //   seconds: 900,
 * //   minutes: 15
 * // }
 */
export function normalizeTimeFromMinutes(minutes: number): NormalizedTime {
  if (!Number.isInteger(minutes) || minutes <= 0) {
    throw new Error(
      `Invalid minutes value: ${minutes}. Must be a positive integer.`,
    )
  }

  const milliseconds = minutes * 60 * 1000

  return {
    raw: `${minutes}m`,
    ms: milliseconds,
    seconds: minutes * 60,
    minutes: minutes,
  }
}

/**
 * Normaliza un número (en días) a un objeto de tiempo
 *
 * Útil para TTLs largos como trusted devices o refresh tokens.
 * Por ejemplo: TRUSTED_DEVICE_TTL_DAYS=90
 *
 * @param days - Número de días
 * @returns Objeto con todas las unidades de tiempo
 *
 * @example
 * const ttl = normalizeTimeFromDays(90)
 * // {
 * //   raw: "90d",
 * //   ms: 7776000000,
 * //   seconds: 7776000,
 * //   minutes: 129600
 * // }
 */
export function normalizeTimeFromDays(days: number): NormalizedTime {
  if (!Number.isInteger(days) || days <= 0) {
    throw new Error(`Invalid days value: ${days}. Must be a positive integer.`)
  }

  const milliseconds = days * 24 * 60 * 60 * 1000

  return {
    raw: `${days}d`,
    ms: milliseconds,
    seconds: days * 24 * 60 * 60,
    minutes: days * 24 * 60,
  }
}

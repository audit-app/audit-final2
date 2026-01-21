/**
 * Helper: Convierte formato de tiempo (5m, 1h) a segundos, o devuelve número directo
 */
function parseTimeToSeconds(value: string | undefined, defaultSeconds: number): number {
  if (!value) return defaultSeconds

  // Si ya es un número en formato string (ej: "300")
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10)
  }

  // Si es formato de tiempo (5m, 1h, 30s)
  const match = value.match(/^(\d+)([smh])$/)
  if (match) {
    const [, num, unit] = match
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
    }
    return parseInt(num, 10) * multipliers[unit]
  }

  // Fallback al default
  return defaultSeconds
}

export const TWO_FACTOR_CONFIG = {
  code: {
    length: parseInt(process.env.TWO_FACTOR_CODE_LENGTH || '6', 10),
    expiresIn: parseTimeToSeconds(process.env.TWO_FACTOR_CODE_EXPIRES_IN, 300), // 5 minutos en segundos
  },
  rateLimit: {
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
      windowMinutes: parseInt(
        process.env.TWO_FACTOR_VERIFY_WINDOW_MINUTES || '10',
        10,
      ), // Ventana de tiempo para intentos
    },
  },
} as const

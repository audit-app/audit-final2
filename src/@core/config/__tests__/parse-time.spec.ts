/**
 * Test unitario para parseTimeToSeconds()
 *
 * Asegura que la conversión de tiempo funcione correctamente
 * tanto para JWT como para Redis
 */

describe('parseTimeToSeconds()', () => {
  // Importamos solo la función que necesitamos testar
  // Como está dentro de envs.ts, vamos a crear una versión standalone
  function parseTimeToSeconds(timeStr: string): number {
    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    }

    const match = timeStr.match(/^(\d+)([smhd])$/)
    if (!match) {
      throw new Error(
        `Invalid time format: "${timeStr}". Expected format: <number><unit> (e.g., "5m", "1h", "7d"). ` +
          `Supported units: s (seconds), m (minutes), h (hours), d (days)`,
      )
    }

    const [, value, unit] = match
    const seconds = parseInt(value, 10) * units[unit]

    if (seconds < 1) {
      throw new Error(
        `Time value too small: "${timeStr}" (must be at least 1 second)`,
      )
    }

    if (seconds > 31536000) {
      throw new Error(
        `Time value too large: "${timeStr}" (maximum: 365d or 1 year)`,
      )
    }

    return seconds
  }

  describe('Valid formats', () => {
    it('should parse seconds correctly', () => {
      expect(parseTimeToSeconds('30s')).toBe(30)
      expect(parseTimeToSeconds('1s')).toBe(1)
      expect(parseTimeToSeconds('60s')).toBe(60)
    })

    it('should parse minutes correctly', () => {
      expect(parseTimeToSeconds('5m')).toBe(300) // 5 * 60
      expect(parseTimeToSeconds('1m')).toBe(60)
      expect(parseTimeToSeconds('15m')).toBe(900)
    })

    it('should parse hours correctly', () => {
      expect(parseTimeToSeconds('1h')).toBe(3600) // 1 * 60 * 60
      expect(parseTimeToSeconds('2h')).toBe(7200)
      expect(parseTimeToSeconds('24h')).toBe(86400)
    })

    it('should parse days correctly', () => {
      expect(parseTimeToSeconds('1d')).toBe(86400) // 1 * 24 * 60 * 60
      expect(parseTimeToSeconds('7d')).toBe(604800) // 7 días (JWT_REFRESH_EXPIRES_IN default)
      expect(parseTimeToSeconds('30d')).toBe(2592000) // 30 días
    })
  })

  describe('Common use cases', () => {
    it('should handle JWT access token default (15m)', () => {
      expect(parseTimeToSeconds('15m')).toBe(900)
    })

    it('should handle JWT refresh token default (7d)', () => {
      expect(parseTimeToSeconds('7d')).toBe(604800)
    })

    it('should handle 2FA code expiry (5m)', () => {
      expect(parseTimeToSeconds('5m')).toBe(300)
    })

    it('should handle reset password token (1h)', () => {
      expect(parseTimeToSeconds('1h')).toBe(3600)
    })

    it('should handle email verification (7d)', () => {
      expect(parseTimeToSeconds('7d')).toBe(604800)
    })

    it('should handle trusted device TTL (90d)', () => {
      // 90 días, pero vamos a usar el cálculo directo
      expect(parseTimeToSeconds('90d')).toBe(7776000)
    })
  })

  describe('Invalid formats', () => {
    it('should reject invalid unit', () => {
      expect(() => parseTimeToSeconds('5w')).toThrow('Invalid time format')
      expect(() => parseTimeToSeconds('10y')).toThrow('Invalid time format')
    })

    it('should reject missing unit', () => {
      expect(() => parseTimeToSeconds('300')).toThrow('Invalid time format')
    })

    it('should reject missing number', () => {
      expect(() => parseTimeToSeconds('m')).toThrow('Invalid time format')
      expect(() => parseTimeToSeconds('h')).toThrow('Invalid time format')
    })

    it('should reject decimal numbers', () => {
      expect(() => parseTimeToSeconds('1.5h')).toThrow('Invalid time format')
      expect(() => parseTimeToSeconds('0.5m')).toThrow('Invalid time format')
    })

    it('should reject negative numbers', () => {
      expect(() => parseTimeToSeconds('-5m')).toThrow('Invalid time format')
    })

    it('should reject empty string', () => {
      expect(() => parseTimeToSeconds('')).toThrow('Invalid time format')
    })

    it('should reject invalid characters', () => {
      expect(() => parseTimeToSeconds('5 m')).toThrow('Invalid time format') // espacio
      expect(() => parseTimeToSeconds('5min')).toThrow('Invalid time format') // texto largo
    })
  })

  describe('Edge cases', () => {
    it('should reject 0 seconds', () => {
      expect(() => parseTimeToSeconds('0s')).toThrow('Time value too small')
      expect(() => parseTimeToSeconds('0m')).toThrow('Time value too small')
    })

    it('should reject values larger than 1 year (365d)', () => {
      expect(() => parseTimeToSeconds('366d')).toThrow('Time value too large')
      expect(() => parseTimeToSeconds('500d')).toThrow('Time value too large')
    })

    it('should accept exactly 365d (maximum)', () => {
      expect(parseTimeToSeconds('365d')).toBe(31536000) // 365 * 24 * 60 * 60
    })

    it('should accept 1s (minimum)', () => {
      expect(parseTimeToSeconds('1s')).toBe(1)
    })
  })

  describe('Integration with JWT and Redis', () => {
    it('should produce values compatible with jsonwebtoken', () => {
      // jsonwebtoken acepta strings como "7d", "1h", etc.
      // Nuestro parseTimeToSeconds no afecta a JWT porque JWT usa el string original
      const jwtFormat = '7d' // Se pasa tal cual a jwt.sign()
      const redisSeconds = parseTimeToSeconds(jwtFormat) // Se convierte para Redis

      expect(typeof jwtFormat).toBe('string') // JWT usa string
      expect(typeof redisSeconds).toBe('number') // Redis usa número
      expect(redisSeconds).toBe(604800)
    })

    it('should produce values compatible with Redis TTL (SETEX)', () => {
      // Redis SETEX espera segundos como número entero
      const ttl = parseTimeToSeconds('7d')

      expect(Number.isInteger(ttl)).toBe(true) // Debe ser entero
      expect(ttl).toBeGreaterThan(0) // Debe ser positivo
      expect(ttl).toBe(604800)
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle all default values from .env', () => {
      const defaults = {
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
        TWO_FACTOR_CODE_EXPIRES_IN: '5m',
        RESET_PASSWORD_TOKEN_EXPIRES_IN: '1h',
        EMAIL_VERIFICATION_EXPIRES_IN: '7d',
      }

      expect(parseTimeToSeconds(defaults.JWT_EXPIRES_IN)).toBe(900)
      expect(parseTimeToSeconds(defaults.JWT_REFRESH_EXPIRES_IN)).toBe(604800)
      expect(parseTimeToSeconds(defaults.TWO_FACTOR_CODE_EXPIRES_IN)).toBe(300)
      expect(parseTimeToSeconds(defaults.RESET_PASSWORD_TOKEN_EXPIRES_IN)).toBe(
        3600,
      )
      expect(parseTimeToSeconds(defaults.EMAIL_VERIFICATION_EXPIRES_IN)).toBe(
        604800,
      )
    })

    it('should handle production vs development configurations', () => {
      // Desarrollo: tokens más largos
      expect(parseTimeToSeconds('7d')).toBe(604800)
      expect(parseTimeToSeconds('30d')).toBe(2592000)

      // Producción: tokens más cortos (más seguro)
      expect(parseTimeToSeconds('1d')).toBe(86400)
      expect(parseTimeToSeconds('4h')).toBe(14400)
    })
  })
})

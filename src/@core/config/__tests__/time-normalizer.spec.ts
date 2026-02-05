import {
  normalizeTime,
  normalizeTimeFromSeconds,
  normalizeTimeFromMinutes,
  normalizeTimeFromDays,
  type NormalizedTime,
} from '../time-normalizer'

describe('Time Normalizer', () => {
  describe('normalizeTime()', () => {
    it('should normalize seconds format correctly', () => {
      const result = normalizeTime('30s')

      expect(result).toEqual({
        raw: '30s',
        ms: 30000,
        seconds: 30,
        minutes: 0,
      })
    })

    it('should normalize minutes format correctly', () => {
      const result = normalizeTime('5m')

      expect(result).toEqual({
        raw: '5m',
        ms: 300000,
        seconds: 300,
        minutes: 5,
      })
    })

    it('should normalize hours format correctly', () => {
      const result = normalizeTime('1h')

      expect(result).toEqual({
        raw: '1h',
        ms: 3600000,
        seconds: 3600,
        minutes: 60,
      })
    })

    it('should normalize days format correctly', () => {
      const result = normalizeTime('7d')

      expect(result).toEqual({
        raw: '7d',
        ms: 604800000,
        seconds: 604800,
        minutes: 10080,
      })
    })

    it('should normalize weeks format correctly', () => {
      const result = normalizeTime('2w')

      expect(result).toEqual({
        raw: '2w',
        ms: 1209600000,
        seconds: 1209600,
        minutes: 20160,
      })
    })

    it('should throw error for invalid format', () => {
      expect(() => normalizeTime('invalid')).toThrow()
      expect(() => normalizeTime('')).toThrow()
      expect(() => normalizeTime('abc')).toThrow()
    })

    it('should throw error for negative values', () => {
      expect(() => normalizeTime('-5m')).toThrow(/Invalid time format/)
    })

    it('should throw error for zero values', () => {
      expect(() => normalizeTime('0s')).toThrow(/Invalid time format/)
    })

    it('should throw error for values exceeding 1 year', () => {
      expect(() => normalizeTime('366d')).toThrow(/Time value too large/)
      expect(() => normalizeTime('400d')).toThrow(/Time value too large/)
    })

    it('should allow exactly 365 days', () => {
      expect(() => normalizeTime('365d')).not.toThrow()
    })
  })

  describe('normalizeTimeFromSeconds()', () => {
    it('should normalize 60 seconds correctly', () => {
      const result = normalizeTimeFromSeconds(60)

      expect(result).toEqual({
        raw: '60s',
        ms: 60000,
        seconds: 60,
        minutes: 1,
      })
    })

    it('should normalize 300 seconds correctly', () => {
      const result = normalizeTimeFromSeconds(300)

      expect(result).toEqual({
        raw: '300s',
        ms: 300000,
        seconds: 300,
        minutes: 5,
      })
    })

    it('should handle large values', () => {
      const result = normalizeTimeFromSeconds(86400) // 1 day

      expect(result.seconds).toBe(86400)
      expect(result.minutes).toBe(1440)
      expect(result.ms).toBe(86400000)
    })

    it('should throw error for non-integer values', () => {
      expect(() => normalizeTimeFromSeconds(5.5)).toThrow(
        /Must be a positive integer/,
      )
    })

    it('should throw error for negative values', () => {
      expect(() => normalizeTimeFromSeconds(-60)).toThrow(
        /Must be a positive integer/,
      )
    })

    it('should throw error for zero', () => {
      expect(() => normalizeTimeFromSeconds(0)).toThrow(
        /Must be a positive integer/,
      )
    })
  })

  describe('normalizeTimeFromMinutes()', () => {
    it('should normalize 5 minutes correctly', () => {
      const result = normalizeTimeFromMinutes(5)

      expect(result).toEqual({
        raw: '5m',
        ms: 300000,
        seconds: 300,
        minutes: 5,
      })
    })

    it('should normalize 15 minutes correctly', () => {
      const result = normalizeTimeFromMinutes(15)

      expect(result).toEqual({
        raw: '15m',
        ms: 900000,
        seconds: 900,
        minutes: 15,
      })
    })

    it('should throw error for non-integer values', () => {
      expect(() => normalizeTimeFromMinutes(5.5)).toThrow(
        /Must be a positive integer/,
      )
    })

    it('should throw error for negative values', () => {
      expect(() => normalizeTimeFromMinutes(-5)).toThrow(
        /Must be a positive integer/,
      )
    })

    it('should throw error for zero', () => {
      expect(() => normalizeTimeFromMinutes(0)).toThrow(
        /Must be a positive integer/,
      )
    })
  })

  describe('normalizeTimeFromDays()', () => {
    it('should normalize 7 days correctly', () => {
      const result = normalizeTimeFromDays(7)

      expect(result).toEqual({
        raw: '7d',
        ms: 604800000,
        seconds: 604800,
        minutes: 10080,
      })
    })

    it('should normalize 90 days correctly', () => {
      const result = normalizeTimeFromDays(90)

      expect(result).toEqual({
        raw: '90d',
        ms: 7776000000,
        seconds: 7776000,
        minutes: 129600,
      })
    })

    it('should throw error for non-integer values', () => {
      expect(() => normalizeTimeFromDays(7.5)).toThrow(
        /Must be a positive integer/,
      )
    })

    it('should throw error for negative values', () => {
      expect(() => normalizeTimeFromDays(-7)).toThrow(
        /Must be a positive integer/,
      )
    })

    it('should throw error for zero', () => {
      expect(() => normalizeTimeFromDays(0)).toThrow(
        /Must be a positive integer/,
      )
    })
  })

  describe('Real-world usage scenarios', () => {
    it('JWT access token (15 minutes)', () => {
      const time = normalizeTime('15m')

      // Para JWT: usa el raw string
      expect(time.raw).toBe('15m')

      // Para verificación interna: usa seconds
      expect(time.seconds).toBe(900)
    })

    it('JWT refresh token (7 days)', () => {
      const time = normalizeTime('7d')

      // Para JWT: usa el raw string
      expect(time.raw).toBe('7d')

      // Para Redis TTL: usa seconds
      expect(time.seconds).toBe(604800)
    })

    it('2FA code expiration (5 minutes)', () => {
      const time = normalizeTime('5m')

      // Para OTP Service (Redis): usa seconds
      expect(time.seconds).toBe(300)

      // Para email/UI: usa minutes
      expect(time.minutes).toBe(5)
    })

    it('Resend cooldown (60 seconds)', () => {
      const time = normalizeTimeFromSeconds(60)

      // Para rate limiting: usa seconds
      expect(time.seconds).toBe(60)

      // Para display: usa minutes
      expect(time.minutes).toBe(1)
    })

    it('Trusted device TTL (90 days)', () => {
      const time = normalizeTimeFromDays(90)

      // Para cookies: usa ms
      expect(time.ms).toBe(7776000000)

      // Para Redis: usa seconds
      expect(time.seconds).toBe(7776000)
    })

    it('Login attempts window (15 minutes)', () => {
      const time = normalizeTimeFromMinutes(15)

      // Para rate limiting: usa seconds
      expect(time.seconds).toBe(900)

      // Para logs/mensajes: usa minutes
      expect(time.minutes).toBe(15)
    })
  })

  describe('Type safety', () => {
    it('should have correct TypeScript types', () => {
      const time: NormalizedTime = normalizeTime('5m')

      // Verificar que todas las propiedades existen
      expect(typeof time.raw).toBe('string')
      expect(typeof time.ms).toBe('number')
      expect(typeof time.seconds).toBe('number')
      expect(typeof time.minutes).toBe('number')
    })
  })
})

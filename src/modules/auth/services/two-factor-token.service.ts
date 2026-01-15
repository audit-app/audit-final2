import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import * as crypto from 'crypto'
import { CACHE_KEYS, REDIS_CLIENT, REDIS_PREFIXES } from '@core/cache'
import { RateLimitService } from '@core/security'
import { RATE_LIMIT_CONFIG } from '../config/rate-limit.config'
import { TooManyAttemptsException } from '../exceptions'

interface TwoFactorData {
  userId: string
  code: string
}

/**
 * Servicio de gestión de códigos 2FA (Two-Factor Authentication)
 *
 * ENFOQUE SIMPLIFICADO (solo Redis, sin JWT):
 * ===========================================
 * - Token: String aleatorio de 64 caracteres hexadecimales
 * - Código: Número aleatorio de 6 dígitos
 * - Almacenamiento: Redis con TTL
 * - Key: auth:2fa:{token}
 * - Value: JSON {userId, code}
 * - Un solo uso: Se elimina de Redis después de validación exitosa
 *
 * Ventajas sobre JWT + Redis:
 * - Más simple: una sola fuente de verdad (Redis)
 * - Mismo nivel de seguridad: token aleatorio de 256 bits
 * - Menos dependencias: no necesita JWT secret
 * - Más natural: el token ES la key de Redis directamente
 * - Revocable: código se elimina de Redis al usarse
 *
 * Seguridad implementada:
 * - Rate limiting: Máximo 5 intentos por token
 * - Un solo uso: Código se elimina después de validación exitosa
 * - TTL automático: Códigos expiran en 5 minutos
 * - Comparación timing-safe: Previene timing attacks
 *
 * Variables de entorno:
 * - TWO_FACTOR_CODE_LENGTH: Longitud del código numérico (default: 6)
 * - TWO_FACTOR_CODE_EXPIRES_IN: Tiempo de expiración (default: '5m')
 */
@Injectable()
export class TwoFactorTokenService {
  private readonly codeLength: number
  private readonly codeExpiry: string
  private readonly maxAttempts = RATE_LIMIT_CONFIG.twoFactor.maxAttempts
  private readonly attemptsWindow = RATE_LIMIT_CONFIG.twoFactor.windowMinutes

  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimitService: RateLimitService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.codeLength = configService.get('TWO_FACTOR_CODE_LENGTH', 6)
    this.codeExpiry = configService.get('TWO_FACTOR_CODE_EXPIRES_IN', '5m')
  }

  /**
   * Genera un código 2FA
   *
   * Flujo SIMPLE:
   * 1. Genera un token aleatorio (256 bits = 64 chars hex)
   * 2. Genera un código numérico aleatorio (6 dígitos)
   * 3. Almacena en Redis: auth:2fa:{token} → JSON {userId, code}
   * 4. Devuelve token y código
   *
   * @param userId - ID del usuario
   * @returns Objeto con code (para enviar al usuario) y token (para validación)
   */
  async generateCode(userId: string): Promise<{ code: string; token: string }> {
    // Generar token aleatorio (256 bits)
    const token = crypto.randomBytes(32).toString('hex') // 64 chars

    // Generar código numérico aleatorio
    const code = this.generateNumericCode()

    // Almacenar en Redis con TTL
    const ttlSeconds = this.parseExpiryToSeconds(this.codeExpiry)
    const key = CACHE_KEYS.TWO_FACTOR(token)
    const data: TwoFactorData = { userId, code }
    await this.redis.setex(key, ttlSeconds, JSON.stringify(data))

    return { code, token }
  }

  /**
   * Valida un código 2FA
   *
   * Flujo de validación SIMPLE:
   * 1. Verifica rate limiting (máximo 5 intentos por token)
   * 2. Obtiene datos de Redis usando el token
   * 3. Verifica que el userId coincida
   * 4. Compara código con timing-safe comparison
   * 5. Si es válido: elimina código (one-time use) y resetea intentos
   * 6. Si es inválido: incrementa contador de intentos
   *
   * @param userId - ID del usuario
   * @param code - Código numérico a validar
   * @param token - Token (OBLIGATORIO)
   * @returns true si el código es válido
   * @throws TooManyAttemptsException si excede intentos
   */
  async validateCode(
    userId: string,
    code: string,
    token: string,
  ): Promise<boolean> {
    // 1. Verificar rate limiting por token
    const rateLimitKey = CACHE_KEYS.TWO_FACTOR_VERIFY_ATTEMPTS(token)
    const canAttempt = await this.rateLimitService.checkLimit(
      rateLimitKey,
      this.maxAttempts,
      this.attemptsWindow,
    )

    if (!canAttempt) {
      const remaining =
        await this.rateLimitService.getTimeUntilReset(rateLimitKey)
      throw new TooManyAttemptsException(
        `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(remaining / 60)} minutos.`,
      )
    }

    try {
      // 2. Obtener datos de Redis
      const key = CACHE_KEYS.TWO_FACTOR(token)
      const dataStr = await this.redis.get(key)

      if (!dataStr) {
        // Token no existe o expiró
        await this.rateLimitService.incrementAttempts(
          rateLimitKey,
          this.attemptsWindow,
        )
        return false
      }

      const data: TwoFactorData = JSON.parse(dataStr)

      // 3. Verificar userId
      if (data.userId !== userId) {
        await this.rateLimitService.incrementAttempts(
          rateLimitKey,
          this.attemptsWindow,
        )
        return false
      }

      // 4. Comparar códigos (timing-safe comparison)
      if (!this.secureCompare(code, data.code)) {
        // Código incorrecto - incrementar intentos
        await this.rateLimitService.incrementAttempts(
          rateLimitKey,
          this.attemptsWindow,
        )
        return false
      }

      // 5. Código válido - eliminar de Redis (one-time use) y resetear intentos
      await this.redis.del(key)
      await this.rateLimitService.resetAttempts(rateLimitKey)

      return true
    } catch {
      await this.rateLimitService.incrementAttempts(
        rateLimitKey,
        this.attemptsWindow,
      )
      return false
    }
  }

  /**
   * Revoca todos los códigos 2FA de un usuario
   *
   * NOTA: Con la nueva estructura simplificada, no podemos buscar
   * códigos por userId directamente (el userId está en el valor JSON).
   * Para revocar códigos por usuario, necesitaríamos escanear todas las keys
   * auth:2fa:* y parsear el JSON (ineficiente).
   *
   * Por ahora, este método queda como placeholder.
   *
   * @param userId - ID del usuario
   * @returns Número de códigos revocados
   */
  async revokeAllUserCodes(userId: string): Promise<number> {
    // Con la estructura actual auth:2fa:{token} → {userId, code}
    // no podemos buscar por userId eficientemente.
    // En la práctica, los códigos expiran en 5 minutos de todos modos.
    return 0
  }

  /**
   * Genera un código numérico aleatorio
   */
  private generateNumericCode(): string {
    const max = Math.pow(10, this.codeLength)
    const code = crypto.randomInt(0, max)
    return code.toString().padStart(this.codeLength, '0')
  }

  /**
   * Comparación segura de strings (timing-safe)
   * Previene timing attacks
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  }

  /**
   * Obtiene el TTL restante de un código
   */
  async getCodeTTL(token: string): Promise<number> {
    const key = CACHE_KEYS.TWO_FACTOR(token)
    return await this.redis.ttl(key)
  }

  /**
   * Obtiene los intentos restantes para un token
   */
  async getRemainingAttempts(token: string): Promise<number> {
    const rateLimitKey = CACHE_KEYS.TWO_FACTOR_VERIFY_ATTEMPTS(token)
    return await this.rateLimitService.getRemainingAttempts(
      rateLimitKey,
      this.maxAttempts,
    )
  }

  /**
   * Convierte formato de tiempo (1h, 30m, 60s) a segundos
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/)
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`)
    }

    const value = parseInt(match[1], 10)
    const unit = match[2]

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    }

    return value * multipliers[unit]
  }
}

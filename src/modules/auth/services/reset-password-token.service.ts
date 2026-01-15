import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CACHE_KEYS, REDIS_CLIENT } from '@core/cache'
import { RateLimitService } from '@core/security'
import { RATE_LIMIT_CONFIG } from '../config/rate-limit.config'
import { TooManyAttemptsException } from '../exceptions'
import * as crypto from 'crypto'
import Redis from 'ioredis'

/**
 * Servicio de gestión de tokens de reset password
 *
 * ENFOQUE SIMPLIFICADO (solo Redis, sin JWT):
 * ============================================
 * - Token: String aleatorio de 64 caracteres hexadecimales
 * - Almacenamiento: Redis con TTL
 * - Key: auth:reset-pw:{token}
 * - Value: userId (string)
 * - Un solo uso: Se elimina de Redis después de usarse
 *
 * Ventajas sobre JWT + Redis:
 * - Más simple: una sola fuente de verdad (Redis)
 * - Mismo nivel de seguridad: token aleatorio de 256 bits
 * - Menos dependencias: no necesita JWT secret
 * - Más natural: el token ES la key de Redis directamente
 * - Revocable: token se elimina de Redis al usarse o revocar
 *
 * Variables de entorno:
 * - RESET_PASSWORD_TOKEN_EXPIRES_IN: Tiempo de expiración (default: '1h')
 */
@Injectable()
export class ResetPasswordTokenService {
  private readonly tokenExpiry: string
  private readonly maxAttemptsByIp =
    RATE_LIMIT_CONFIG.resetPassword.maxAttemptsByIp
  private readonly attemptsWindow =
    RATE_LIMIT_CONFIG.resetPassword.windowMinutes

  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimitService: RateLimitService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.tokenExpiry = configService.get(
      'RESET_PASSWORD_TOKEN_EXPIRES_IN',
      '1h',
    )
  }

  /**
   * Genera un token de reset password
   *
   * Flujo SIMPLE:
   * 1. Genera un token aleatorio (256 bits = 64 chars hex)
   * 2. Almacena en Redis: auth:reset-pw:{token} → userId
   * 3. Devuelve el token al cliente
   *
   * @param userId - ID del usuario
   * @returns Token aleatorio de 64 caracteres
   */
  async generateToken(userId: string): Promise<string> {
    // Generar token aleatorio (256 bits)
    const token = crypto.randomBytes(32).toString('hex') // 64 chars

    // Almacenar en Redis con TTL
    const ttlSeconds = this.parseExpiryToSeconds(this.tokenExpiry)
    const key = CACHE_KEYS.RESET_PASSWORD(token)
    await this.redis.setex(key, ttlSeconds, userId)

    return token
  }

  /**
   * Valida un token de reset password CON RATE LIMITING
   *
   * Flujo de validación SIMPLE:
   * 1. Verifica rate limiting por IP (10 intentos en 60 min)
   * 2. Busca userId en Redis usando el token como key
   * 3. Si existe, resetea intentos y devuelve userId
   * 4. Si no existe, incrementa contador y devuelve null
   *
   * Esto garantiza:
   * - Protección contra fuerza bruta (rate limiting)
   * - El token existe y no ha expirado (Redis TTL)
   * - El token no ha sido revocado (existe en Redis)
   *
   * @param token - Token a validar
   * @param ip - Dirección IP del usuario (para rate limiting)
   * @returns userId si el token es válido, null si no
   * @throws TooManyAttemptsException si excede intentos
   */
  async validateToken(token: string, ip: string): Promise<string | null> {
    // 1. Verificar rate limiting por IP
    const rateLimitKeyIp = CACHE_KEYS.RESET_PASSWORD_ATTEMPTS_IP(ip)
    const canAttemptByIp = await this.rateLimitService.checkLimit(
      rateLimitKeyIp,
      this.maxAttemptsByIp,
      this.attemptsWindow,
    )

    if (!canAttemptByIp) {
      const remaining =
        await this.rateLimitService.getTimeUntilReset(rateLimitKeyIp)
      throw new TooManyAttemptsException(
        `Demasiados intentos desde esta IP. Intenta de nuevo en ${Math.ceil(remaining / 60)} minutos.`,
      )
    }

    try {
      // 2. Buscar userId en Redis
      const key = CACHE_KEYS.RESET_PASSWORD(token)
      const userId = await this.redis.get(key)

      if (!userId) {
        // Token no existe o expiró
        await this.rateLimitService.incrementAttempts(
          rateLimitKeyIp,
          this.attemptsWindow,
        )
        return null
      }

      // 3. Token válido - resetear intentos
      await this.rateLimitService.resetAttempts(rateLimitKeyIp)

      return userId
    } catch {
      await this.rateLimitService.incrementAttempts(
        rateLimitKeyIp,
        this.attemptsWindow,
      )
      return null
    }
  }

  /**
   * Revoca un token de reset password
   *
   * Simplemente elimina el token de Redis, haciéndolo inválido.
   *
   * Casos de uso:
   * - Usuario cambia su contraseña exitosamente
   * - Administrador revoca manualmente el token
   * - Usuario solicita un nuevo token (revocar el anterior)
   *
   * @param token - Token a revocar
   * @returns true si se revocó exitosamente, false si no existía
   */
  async revokeToken(token: string): Promise<boolean> {
    try {
      const key = CACHE_KEYS.RESET_PASSWORD(token)
      const result = await this.redis.del(key)
      return result > 0
    } catch {
      return false
    }
  }

  /**
   * Revoca todos los tokens de reset password de un usuario
   *
   * NOTA: Con la nueva estructura simplificada, no podemos buscar
   * tokens por userId directamente (el userId es el valor, no parte de la key).
   * Para implementar esto correctamente, necesitaríamos un índice adicional
   * o cambiar la estrategia de almacenamiento.
   *
   * Por ahora, este método queda como placeholder para futuras implementaciones.
   *
   * @param userId - ID del usuario
   * @returns Número de tokens revocados
   */
  async revokeUserTokens(userId: string): Promise<number> {
    // Con la estructura actual auth:reset-pw:{token} → userId
    // no podemos buscar por userId eficientemente.
    // Opciones:
    // 1. Mantener un índice secundario: auth:reset-pw:user:{userId} → [tokens]
    // 2. Escanear todas las keys (ineficiente en producción)
    // 3. Aceptar que no podemos revocar todos los tokens por usuario
    //
    // Para simplicidad, retornamos 0 (no implementado)
    // En la práctica, los tokens expiran en 1 hora de todos modos
    return 0
  }

  /**
   * Obtiene el TTL restante de un token
   *
   * @param token - Token a verificar
   * @returns TTL en segundos, -1 si no existe
   */
  async getTokenTTL(token: string): Promise<number> {
    const key = CACHE_KEYS.RESET_PASSWORD(token)
    return await this.redis.ttl(key)
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

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CacheService } from '@core/cache'
import { EMAIL_VERIFICATION_CONFIG } from '../config/email-verification.config'
import ms from 'ms'
import { sign, verify, decode, SignOptions } from 'jsonwebtoken'

/**
 * Payload del JWT de verificación de email
 */
interface EmailVerificationPayload {
  userId: string
  email: string
}

/**
 * Servicio de gestión de tokens de verificación de email
 *
 * ESTRATEGIA: JWT Puro con One-Time Use
 * ==========================================
 * - Token: JWT firmado con EMAIL_VERIFICATION_JWT_SECRET
 * - Payload: { userId, email, iat, exp }
 * - TTL: 7 días (configurable)
 * - One-time use: Se marca como usado en Redis después de verificar
 * - Redis key: auth:email-verification:used:{jti}
 * - Redis TTL: Igual al del JWT (7 días)
 *
 * Ventajas sobre OtpCoreService:
 * - Más simple para verificación de email
 * - Stateless (el token contiene todos los datos)
 * - Auto-expirable (no necesita limpieza manual)
 * - Firma criptográfica diferente (más seguro)
 *
 * Seguridad implementada:
 * - Firma diferente a access tokens (EMAIL_VERIFICATION_JWT_SECRET)
 * - One-time use (se marca como usado en Redis)
 * - Expira en 7 días
 * - Throttler global protege el endpoint
 *
 * Variables de entorno:
 * - EMAIL_VERIFICATION_JWT_SECRET: Secret para firmar JWTs (REQUERIDO)
 * - EMAIL_VERIFICATION_EXPIRES_IN: Tiempo de expiración (default: '7d')
 */
@Injectable()
export class EmailVerificationTokenService {
  private readonly secret = EMAIL_VERIFICATION_CONFIG.jwt.secret
  private readonly expiresIn = EMAIL_VERIFICATION_CONFIG.jwt.expiresIn

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Genera un token JWT de verificación de email
   *
   * El JWT contiene:
   * - userId: ID del usuario
   * - email: Email a verificar
   * - iat: Timestamp de emisión
   * - exp: Timestamp de expiración
   * - jti: ID único del token (para one-time use)
   *
   * @param userId - ID del usuario
   * @param email - Email del usuario
   * @returns Token JWT (string)
   */
  generateToken(userId: string, email: string): string {
    const payload: Record<string, unknown> = {
      userId,
      email,
      jti: this.generateJti(), // ID único para one-time use
    }

    // Asegurarse de que el secret sea válido
    if (!this.secret) {
      throw new Error('EMAIL_VERIFICATION_JWT_SECRET is not configured')
    }

    const options: SignOptions = {
      expiresIn: this.expiresIn as any, // '7d' es válido según JWT spec
    }

    return sign(payload, this.secret, options)
  }

  /**
   * Valida un token JWT de verificación de email
   *
   * Verificaciones:
   * 1. JWT válido (firma correcta)
   * 2. JWT no expirado
   * 3. Token no usado previamente (one-time use)
   *
   * @param token - Token JWT a validar
   * @returns Payload si es válido, null si es inválido
   */
  async validateToken(token: string): Promise<EmailVerificationPayload | null> {
    try {
      // 1. Verificar JWT (firma + expiración)
      const payload = verify(token, this.secret) as
        | (EmailVerificationPayload & { jti: string })
        | undefined

      if (!payload) {
        return null
      }

      // 2. Verificar si el token ya fue usado (one-time use)
      const jti = payload.jti
      const isUsed = await this.isTokenUsed(jti)

      if (isUsed) {
        return null // Token ya fue usado
      }

      return {
        userId: payload.userId,
        email: payload.email,
      }
    } catch {
      // JWT inválido o expirado
      return null
    }
  }

  /**
   * Marca un token como usado (one-time use)
   *
   * Guarda el JTI en Redis con el TTL del JWT
   * para prevenir reutilización del mismo token
   *
   * @param token - Token JWT a marcar como usado
   */
  async markTokenAsUsed(token: string): Promise<void> {
    try {
      const payload = decode(token) as {
        jti: string
        exp: number
      } | null

      if (!payload || !payload.jti) {
        return
      }

      const jti = payload.jti
      const exp = payload.exp // Unix timestamp
      const now = Math.floor(Date.now() / 1000)
      const ttl = exp - now // Segundos restantes hasta la expiración

      if (ttl > 0) {
        const key = this.buildUsedTokenKey(jti)
        await this.cacheService.set(key, '1', ttl)
      }
    } catch {
      // Si falla, no bloqueamos el flujo
    }
  }

  /**
   * Verifica si un token ya fue usado
   *
   * @param jti - ID único del token (JWT ID)
   * @returns true si el token ya fue usado
   */
  private async isTokenUsed(jti: string): Promise<boolean> {
    const key = this.buildUsedTokenKey(jti)
    const value = await this.cacheService.get(key)
    return value !== null
  }

  /**
   * Genera un ID único para el JWT (JTI - JWT ID)
   *
   * Usado para implementar one-time use
   *
   * @returns ID único (timestamp + random)
   */
  private generateJti(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `${timestamp}-${random}`
  }

  /**
   * Construye la key de Redis para tokens usados
   *
   * @param jti - ID único del token
   * @returns Key de Redis
   */
  private buildUsedTokenKey(jti: string): string {
    return `auth:email-verification:used:${jti}`
  }

  /**
   * Obtiene el tiempo de expiración en segundos
   *
   * @returns Segundos de expiración
   */
  getExpirySeconds(): number {
    const milliseconds = ms(this.expiresIn as ms.StringValue)
    return milliseconds / 1000
  }
}

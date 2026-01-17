import { Injectable } from '@nestjs/common'
import * as crypto from 'crypto'
import { CacheService } from '@core/cache'
import { JwtTokenHelper } from '../../shared/helpers'
import { TWO_FACTOR_CONFIG } from '../config/two-factor.config'

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
 * - Un solo uso: Código se elimina después de validación exitosa
 * - TTL automático: Códigos expiran en 5 minutos
 * - Comparación timing-safe: Previene timing attacks
 *
 * NOTA: Rate limiting de 2FA fue ELIMINADO porque:
 * - Login ya tiene rate limiting robusto (5 intentos/15min por usuario)
 * - Códigos expiran en 5 minutos (ventana muy corta)
 * - One-time use previene reutilización
 * - Dispositivos confiables reducen frecuencia de 2FA
 *
 * Variables de entorno:
 * - TWO_FACTOR_CODE_LENGTH: Longitud del código numérico (default: 6)
 * - TWO_FACTOR_CODE_EXPIRES_IN: Tiempo de expiración (default: '5m')
 */
@Injectable()
export class TwoFactorTokenService {
  private readonly codeLength = TWO_FACTOR_CONFIG.code.length
  private readonly codeExpiry = TWO_FACTOR_CONFIG.code.expiresIn

  constructor(
    private readonly cacheService: CacheService,
    private readonly jwtTokenHelper: JwtTokenHelper,
  ) {}

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
    const ttlSeconds = this.jwtTokenHelper.getExpirySeconds(this.codeExpiry)
    const key = `auth:2fa:${token}`
    const data: TwoFactorData = { userId, code }
    await this.cacheService.setJSON(key, data, ttlSeconds)

    return { code, token }
  }

  /**
   * Valida un código 2FA
   *
   * Flujo de validación SIMPLIFICADO:
   * 1. Obtiene datos de Redis usando el token
   * 2. Verifica que el userId coincida
   * 3. Compara el código (timing-safe comparison)
   * 4. Si es válido, elimina el código de Redis (one-time use)
   *
   * NOTA: No tiene rate limiting porque:
   * - Login ya protege con rate limiting robusto
   * - Códigos expiran en 5 minutos (ventana muy corta)
   * - One-time use previene reutilización
   *
   * @param userId - ID del usuario
   * @param code - Código numérico a validar
   * @param token - Token (OBLIGATORIO)
   * @returns true si el código es válido
   */
  async validateCode(
    userId: string,
    code: string,
    token: string,
  ): Promise<boolean> {
    try {
      // 1. Obtener datos de Redis
      const key = `auth:2fa:${token}`
      const data = await this.cacheService.getJSON<TwoFactorData>(key)

      if (!data) {
        // Token no existe o expiró
        return false
      }

      // 2. Verificar userId
      if (data.userId !== userId) {
        return false
      }

      // 3. Comparar códigos (timing-safe comparison)
      if (!this.secureCompare(code, data.code)) {
        return false
      }

      // 4. Código válido - eliminar de Redis (one-time use)
      await this.cacheService.del(key)

      return true
    } catch {
      return false
    }
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
    const key = `auth:2fa:${token}`
    return await this.cacheService.ttl(key)
  }
}

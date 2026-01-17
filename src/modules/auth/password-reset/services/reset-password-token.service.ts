import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CacheService } from '@core/cache'
import * as crypto from 'crypto'
import { TimeUtil } from '@core/utils'

@Injectable()
export class ResetPasswordTokenService {
  private readonly tokenExpiry: string

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    this.tokenExpiry = configService.get(
      'RESET_PASSWORD_TOKEN_EXPIRES_IN',
      '1h',
    )
  }

  private getKey(tokenId: string): string {
    return `auth:reset-pw:${tokenId}`
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
    const tokenId = crypto.randomBytes(32).toString('hex') // 64 chars

    const ttlSeconds = TimeUtil.toSeconds(this.tokenExpiry)
    const key = this.getKey(tokenId)
    await this.cacheService.set(key, userId, ttlSeconds)
    return tokenId
  }

  /**
   * Valida un token de reset password
   *
   * @param tokenId - Token a validar
   * @returns userId si el token es válido, null si no existe o expiró
   */
  async validateToken(tokenId: string): Promise<string | null> {
    const key = this.getKey(tokenId)
    const userId = await this.cacheService.get(key)
    return userId || null
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
      const key = this.getKey(token)
      return await this.cacheService.del(key)
    } catch {
      return false
    }
  }

  /**
   * Obtiene el TTL restante de un token
   *
   * @param token - Token a verificar
   * @returns TTL en segundos, -1 si no existe
   */
  async getTokenTTL(token: string): Promise<number> {
    const key = this.getKey(token)
    return await this.cacheService.ttl(key)
  }
}

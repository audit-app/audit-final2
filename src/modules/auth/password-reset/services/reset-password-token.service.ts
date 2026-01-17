import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CacheService } from '@core/cache'
import * as crypto from 'crypto'
import { TimeUtil } from '@core/utils'

/**
 * Payload almacenado en Redis para reset password
 */
interface ResetPasswordPayload {
  userId: string
  code: string // OTP de 6 dígitos
}

/**
 * Respuesta del método generateToken
 */
export interface GenerateResetTokenResponse {
  tokenId: string // Código de 64 chars (se envía al frontend)
  otpCode: string // Código de 6 dígitos (se envía al correo)
}

@Injectable()
export class ResetPasswordTokenService {
  private readonly tokenExpiry: string
  private readonly otpLength: number

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    this.tokenExpiry = configService.get(
      'RESET_PASSWORD_TOKEN_EXPIRES_IN',
      '1h',
    )
    this.otpLength = configService.get('RESET_PASSWORD_OTP_LENGTH', 6)
  }

  private getKey(tokenId: string): string {
    return `auth:reset-pw:${tokenId}`
  }

  /**
   * Genera un código OTP numérico aleatorio
   */
  private generateOTP(): string {
    const max = Math.pow(10, this.otpLength) - 1
    const min = Math.pow(10, this.otpLength - 1)
    const otp = Math.floor(Math.random() * (max - min + 1)) + min
    return otp.toString()
  }

  /**
   * Valida que el payload sea válido
   */
  private isValidPayload(payload: unknown): payload is ResetPasswordPayload {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'userId' in payload &&
      'code' in payload &&
      typeof (payload as ResetPasswordPayload).userId === 'string' &&
      typeof (payload as ResetPasswordPayload).code === 'string'
    )
  }
  /**
   * Genera un token de reset password con doble validación
   *
   * Flujo de DOBLE VALIDACIÓN:
   * 1. Genera un tokenId aleatorio (256 bits = 64 chars hex) → se envía al frontend
   * 2. Genera un OTP de 6 dígitos → se envía al correo del usuario
   * 3. Almacena en Redis: auth:reset-pw:{tokenId} → { userId, code: OTP }
   * 4. Devuelve { tokenId, otpCode }
   *
   * Seguridad:
   * - El usuario necesita AMBOS códigos para cambiar su contraseña
   * - tokenId: recibido en la respuesta HTTP (64 chars)
   * - otpCode: recibido en su correo electrónico (6 dígitos)
   *
   * @param userId - ID del usuario
   * @returns { tokenId, otpCode } - tokenId para frontend, otpCode para correo
   */
  async generateToken(userId: string): Promise<GenerateResetTokenResponse> {
    // Generar tokenId aleatorio (256 bits = 64 chars hex)
    const tokenId = crypto.randomBytes(32).toString('hex')

    // Generar OTP de 6 dígitos
    const otpCode = this.generateOTP()

    // Guardar payload en Redis
    const payload: ResetPasswordPayload = {
      userId,
      code: otpCode,
    }

    const ttlSeconds = TimeUtil.toSeconds(this.tokenExpiry)
    const key = this.getKey(tokenId)
    await this.cacheService.set(key, JSON.stringify(payload), ttlSeconds)

    return {
      tokenId,
      otpCode,
    }
  }

  /**
   * Valida SOLO el tokenId (sin OTP)
   *
   * Útil para verificar si el tokenId existe antes de solicitar el OTP al usuario.
   * NO debe usarse para autorizar el cambio de contraseña, solo para verificación previa.
   *
   * @param tokenId - Token a validar
   * @returns userId si el token existe, null si no existe o expiró
   */
  async validateToken(tokenId: string): Promise<string | null> {
    const key = this.getKey(tokenId)
    const payloadJson = await this.cacheService.get(key)

    if (!payloadJson) {
      return null
    }

    try {
      const payload = JSON.parse(payloadJson) as unknown
      if (!this.isValidPayload(payload)) {
        return null
      }
      return payload.userId
    } catch {
      return null
    }
  }

  /**
   * Valida el tokenId + OTP (doble validación)
   *
   * MÉTODO PRINCIPAL para autorizar el cambio de contraseña.
   * Valida:
   * 1. Que el tokenId exista en Redis (no expiró)
   * 2. Que el OTP coincida con el almacenado
   * 3. Revoca el token después de validarlo exitosamente (one-time use)
   *
   * @param tokenId - Token de 64 chars recibido del frontend
   * @param otpCode - Código de 6 dígitos recibido del usuario
   * @returns userId si ambos códigos son válidos, null en caso contrario
   */
  async validateTokenWithOtp(
    tokenId: string,
    otpCode: string,
  ): Promise<string | null> {
    const key = this.getKey(tokenId)
    const payloadJson = await this.cacheService.get(key)

    if (!payloadJson) {
      return null
    }

    try {
      const payload = JSON.parse(payloadJson) as unknown

      if (!this.isValidPayload(payload)) {
        return null
      }

      // Validar que el OTP coincida
      if (payload.code !== otpCode) {
        return null
      }

      // Token válido - revocar inmediatamente (one-time use)
      await this.cacheService.del(key)

      return payload.userId
    } catch {
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

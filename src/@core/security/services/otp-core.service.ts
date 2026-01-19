import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CacheService } from '@core/cache'
import * as crypto from 'crypto'

/**
 * Respuesta estándar al crear una sesión OTP
 */
export interface OtpSessionResponse {
  tokenId: string // Token largo (Handle para el front)
  otpCode: string // Código corto (Para el usuario)
}

/**
 * Estructura interna de lo que guardamos en Redis
 */
interface OtpStorage<T> {
  code: string // El OTP real
  payload: T
}

@Injectable()
export class OtpCoreService {
  private readonly defaultOtpLength: number

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    this.defaultOtpLength = this.configService.get('OTP_LENGTH', 6)
  }

  // ==========================================
  // MÉTODOS PÚBLICOS
  // ==========================================

  /**
   * Crea una sesión OTP genérica.
   * * @param contextPrefix - Prefijo para Redis (ej: 'reset-pw', '2fa-login')
   * @param payload - Objeto JSON con los datos que quieras recuperar luego
   * @param ttlSeconds - Tiempo de vida en segundos
   * @param otpLength - (Opcional) Longitud del código
   */
  async createSession<T>(
    contextPrefix: string,
    payload: T,
    ttlSeconds: number,
    otpLength = this.defaultOtpLength,
  ): Promise<OtpSessionResponse> {
    // 1. Generar identificadores
    const tokenId = crypto.randomBytes(32).toString('hex')
    const otpCode = this.generateNumericOtp(otpLength)

    // 2. Preparar storage
    const storageData: OtpStorage<T> = {
      code: otpCode,
      payload: payload,
    }

    // 3. Guardar en Redis
    const key = this.buildKey(contextPrefix, tokenId)
    await this.cacheService.set(key, JSON.stringify(storageData), ttlSeconds)

    return { tokenId, otpCode }
  }

  /**
   * Valida el OTP y devuelve el Payload asociado.
   * IMPORTANTE: No borra el token automáticamente (permite reintentos si falla).
   * El borrado (Token Burning) lo debe decidir el caso de uso si es exitoso o si supera intentos.
   */
  async validateSession<T>(
    contextPrefix: string,
    tokenId: string,
    inputOtp: string,
  ): Promise<{ isValid: boolean; payload: T | null }> {
    const key = this.buildKey(contextPrefix, tokenId)
    const storedJson = await this.cacheService.get(key)

    if (!storedJson) {
      return { isValid: false, payload: null } // Expiró o no existe
    }

    const data = JSON.parse(storedJson) as OtpStorage<T>

    // Comparación estricta del OTP
    if (data.code !== inputOtp) {
      return { isValid: false, payload: data.payload } // Payload útil para logs, pero inválido
    }

    return { isValid: true, payload: data.payload }
  }

  /**
   * Obtiene el payload sin validar el OTP (útil para "Peeking" o validaciones previas)
   */
  async getPayload<T>(
    contextPrefix: string,
    tokenId: string,
  ): Promise<T | null> {
    const key = this.buildKey(contextPrefix, tokenId)
    const storedJson = await this.cacheService.get(key)

    if (!storedJson) return null

    const data = JSON.parse(storedJson) as OtpStorage<T>
    return data.payload
  }

  /**
   * Obtiene la sesión completa (código + payload) sin validar
   * Útil para resend donde necesitamos reenviar el mismo código
   */
  async getSession<T>(
    contextPrefix: string,
    tokenId: string,
  ): Promise<{ otpCode: string; payload: T } | null> {
    const key = this.buildKey(contextPrefix, tokenId)
    const storedJson = await this.cacheService.get(key)

    if (!storedJson) return null

    const data = JSON.parse(storedJson) as OtpStorage<T>
    return {
      otpCode: data.code,
      payload: data.payload,
    }
  }

  /**
   * Elimina la sesión manualmente (Token Burning)
   */
  async deleteSession(contextPrefix: string, tokenId: string): Promise<void> {
    const key = this.buildKey(contextPrefix, tokenId)
    await this.cacheService.del(key)
  }

  // ==========================================
  // HELPERS PRIVADOS
  // ==========================================

  private buildKey(prefix: string, tokenId: string): string {
    return `auth:${prefix}:${tokenId}`
  }

  private generateNumericOtp(length: number): string {
    const max = Math.pow(10, length) - 1
    const min = Math.pow(10, length - 1)
    return (Math.floor(Math.random() * (max - min + 1)) + min).toString()
  }
}

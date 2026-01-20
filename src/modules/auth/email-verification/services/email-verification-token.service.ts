import { Injectable } from '@nestjs/common'
import { OtpCoreService } from '@core/security'
import { EMAIL_VERIFICATION_CONFIG } from '../config/email-verification.config'
import ms from 'ms'

/**
 * Payload almacenado en Redis para verificación de email
 */
interface EmailVerificationPayload {
  userId: string
  email: string
}

/**
 * Servicio de gestión de tokens de verificación de email
 *
 * ESTRATEGIA UNIFICADA: Usa OtpCoreService (igual que 2FA y reset-password)
 * ===========================================================================
 * - TokenId: String aleatorio de 64 caracteres hexadecimales
 * - Payload: { userId, email }
 * - Almacenamiento: Redis con TTL de 7 días
 * - Key: auth:email-verification:{tokenId}
 * - Value: JSON { code: 'N/A', payload: {userId, email} }
 * - One-time use: Se elimina de Redis después de validar
 *
 * IMPORTANTE: A diferencia de 2FA, NO se genera código OTP visible
 * Solo usamos el tokenId como identificador único en el enlace del email
 *
 * Ventajas de unificar con OtpCoreService:
 * - Reutilización de código probado
 * - Consistencia con otros flujos (2FA, reset-password)
 * - Elimina dependencia de jsonwebtoken
 * - Simplifica la lógica (no necesita JWT signing/verification)
 * - Mantenimiento centralizado
 *
 * Seguridad implementada:
 * - TokenId aleatorio de 256 bits (64 chars hex)
 * - One-time use (se elimina de Redis después de validar)
 * - Expira en 7 días (TTL automático)
 * - Throttler global protege el endpoint
 *
 * Variables de entorno:
 * - EMAIL_VERIFICATION_EXPIRES_IN: Tiempo de expiración (default: '7d')
 */
@Injectable()
export class EmailVerificationTokenService {
  private readonly contextPrefix = 'email-verification'
  private readonly expiresIn = EMAIL_VERIFICATION_CONFIG.jwt.expiresIn

  constructor(private readonly otpCoreService: OtpCoreService) {}

  /**
   * Genera un token de verificación de email usando OtpCoreService
   *
   * Flujo:
   * 1. Crea sesión OTP con OtpCoreService (sin código visible)
   * 2. Devuelve tokenId (identificador único para el enlace)
   *
   * El OtpCoreService internamente:
   * - Genera tokenId aleatorio (256 bits = 64 chars hex)
   * - Almacena en Redis: auth:email-verification:{tokenId} → JSON {code: 'N/A', payload: {userId, email}}
   * - TTL: 7 días
   *
   * @param userId - ID del usuario
   * @param email - Email del usuario
   * @returns TokenId (string de 64 caracteres para usar en URL)
   */
  async generateToken(userId: string, email: string): Promise<string> {
    const payload: EmailVerificationPayload = { userId, email }
    const ttlSeconds = this.getExpirySeconds()

    // NO necesitamos código OTP, solo el tokenId
    // OtpCoreService genera un código dummy internamente
    const { tokenId } =
      await this.otpCoreService.createSession<EmailVerificationPayload>(
        this.contextPrefix,
        payload,
        ttlSeconds,
        0, // otpLength: 0 (no necesitamos código visible)
      )

    return tokenId
  }

  /**
   * Valida un token de verificación de email usando OtpCoreService
   *
   * Flujo de validación:
   * 1. Obtiene payload de Redis usando tokenId
   * 2. Si existe → retorna payload
   * 3. Si no existe → retorna null (expiró o no existe)
   *
   * IMPORTANTE: Este método NO elimina el token automáticamente
   * El token debe ser eliminado manualmente con deleteToken() después de
   * verificar el email (one-time use)
   *
   * @param token - TokenId (64 caracteres hex)
   * @returns Payload {userId, email} o null si es inválido
   */
  async validateToken(token: string): Promise<EmailVerificationPayload | null> {
    // Obtener payload sin validar código OTP (no lo necesitamos)
    const payload =
      await this.otpCoreService.getPayload<EmailVerificationPayload>(
        this.contextPrefix,
        token,
      )

    return payload
  }

  /**
   * Marca un token como usado (one-time use) eliminándolo de Redis
   *
   * IMPORTANTE: Este método reemplaza markTokenAsUsed() anterior
   * Ya no necesitamos marcar tokens usados en una key separada,
   * simplemente eliminamos la sesión de Redis
   *
   * @param token - TokenId a eliminar
   */
  async markTokenAsUsed(token: string): Promise<void> {
    await this.otpCoreService.deleteSession(this.contextPrefix, token)
  }

  /**
   * Obtiene el tiempo de expiración en segundos
   *
   * @returns Segundos de expiración (default: 7 días = 604800 segundos)
   */
  getExpirySeconds(): number {
    const milliseconds = ms(this.expiresIn as ms.StringValue)
    return Math.floor(milliseconds / 1000)
  }
}

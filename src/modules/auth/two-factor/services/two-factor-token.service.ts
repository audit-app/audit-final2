import { Injectable } from '@nestjs/common'
import { OtpCoreService } from '@core/security'
import { TWO_FACTOR_CONFIG } from '../config/two-factor.config'

/**
 * Payload que guardamos en el OTP para 2FA
 */
interface TwoFactorPayload {
  userId: string
}

/**
 * Servicio de gestión de códigos 2FA (Two-Factor Authentication)
 *
 * ENFOQUE HÍBRIDO (OtpCoreService):
 * ===========================================
 * - Usa OtpCoreService (genérico) para gestión de sesiones OTP
 * - TokenId: String aleatorio de 64 caracteres hexadecimales (NO es JWT)
 * - Código OTP: Número aleatorio de 6 dígitos
 * - Almacenamiento: Redis con TTL
 * - Key: auth:2fa-login:{tokenId}
 * - Value: JSON {code, payload: {userId}}
 * - Un solo uso: Se elimina de Redis después de validación exitosa
 *
 * IMPORTANTE: "token" siempre se refiere a tokenId (64 caracteres), NO a JWT
 *
 * Ventajas de usar OtpCoreService:
 * - Consistencia con reset-password y otros flujos OTP
 * - Reutilización de código probado
 * - Mantenimiento centralizado
 * - API limpia y estandarizada
 *
 * Seguridad implementada:
 * - Un solo uso: Código se elimina después de validación exitosa
 * - TTL automático: Códigos expiran en 5 minutos (300 segundos)
 * - Rate limiting robusto (ver políticas)
 * - Control de intentos (máximo 3 intentos de verificación)
 *
 * Rate Limiting (ver TWO_FACTOR_CONFIG):
 * - Resend: Espera 60 segundos entre solicitudes
 * - Verificación: Máximo 3 intentos, luego se revoca el tokenId
 *
 * Variables de entorno:
 * - TWO_FACTOR_CODE_LENGTH: Longitud del código numérico (default: 6)
 * - TWO_FACTOR_CODE_EXPIRES_IN: Tiempo de expiración en segundos (default: 300)
 */
@Injectable()
export class TwoFactorTokenService {
  private readonly contextPrefix = '2fa-login' // Prefijo para Redis
  private readonly codeLength = TWO_FACTOR_CONFIG.code.length
  private readonly codeExpiry = TWO_FACTOR_CONFIG.code.expiresIn // En segundos

  constructor(private readonly otpCoreService: OtpCoreService) {}

  /**
   * Genera un código 2FA usando OtpCoreService
   *
   * Flujo:
   * 1. Crea sesión OTP con OtpCoreService
   * 2. Devuelve tokenId (handle) y otpCode (código numérico)
   *
   * El OtpCoreService internamente:
   * - Genera tokenId aleatorio (256 bits = 64 chars hex)
   * - Genera código numérico aleatorio (6 dígitos)
   * - Almacena en Redis: auth:2fa-login:{tokenId} → JSON {code, payload: {userId}}
   *
   * @param userId - ID del usuario
   * @returns Objeto con code (para enviar al usuario) y token (tokenId para validación)
   */
  async generateCode(userId: string): Promise<{ code: string; token: string }> {
    const payload: TwoFactorPayload = { userId }

    const { tokenId, otpCode } =
      await this.otpCoreService.createSession<TwoFactorPayload>(
        this.contextPrefix,
        payload,
        this.codeExpiry, // TTL en segundos
        this.codeLength,
      )

    return {
      code: otpCode,
      token: tokenId,
    }
  }

  /**
   * Valida un código 2FA usando OtpCoreService
   *
   * Flujo de validación:
   * 1. Llama a OtpCoreService.validateSession() con tokenId y código
   * 2. Verifica que el userId del payload coincida
   * 3. Retorna true/false
   *
   * IMPORTANTE: Este método NO elimina el token automáticamente
   * El token debe ser eliminado manualmente después de:
   * - Validación exitosa (después de generar tokens JWT)
   * - Exceso de intentos fallidos (3 intentos)
   *
   * Rate limiting se maneja en el Use Case (Verify2FACodeUseCase)
   * usando el patrón de reset-password
   *
   * @param userId - ID del usuario
   * @param code - Código numérico a validar
   * @param token - TokenId (OBLIGATORIO)
   * @returns Objeto con isValid y payload
   */
  async validateCode(
    userId: string,
    code: string,
    token: string,
  ): Promise<{ isValid: boolean; payload: TwoFactorPayload | null }> {
    const { isValid, payload } =
      await this.otpCoreService.validateSession<TwoFactorPayload>(
        this.contextPrefix,
        token,
        code,
      )

    if (!isValid || !payload) {
      return { isValid: false, payload: null }
    }

    // Verificar que el userId coincida (seguridad adicional)
    if (payload.userId !== userId) {
      return { isValid: false, payload: null }
    }

    return { isValid: true, payload }
  }

  /**
   * Elimina una sesión 2FA manualmente (Token Burning)
   *
   * Casos de uso:
   * - Después de validación exitosa
   * - Cuando se exceden los intentos permitidos
   * - Cuando el usuario solicita un nuevo código (revoca el anterior)
   *
   * @param token - TokenId a eliminar
   */
  async deleteSession(token: string): Promise<void> {
    await this.otpCoreService.deleteSession(this.contextPrefix, token)
  }

  /**
   * Obtiene el payload sin validar el OTP
   * Útil para verificaciones previas o logs
   *
   * @param tokenId - TokenId (64 caracteres hexadecimales)
   * @returns Payload o null si no existe
   */
  async getPayload(tokenId: string): Promise<TwoFactorPayload | null> {
    return await this.otpCoreService.getPayload<TwoFactorPayload>(
      this.contextPrefix,
      tokenId,
    )
  }

  /**
   * Obtiene la sesión completa (código + payload) sin validar
   * Útil para resend (reenviar el mismo código)
   *
   * @param tokenId - TokenId (64 caracteres hexadecimales)
   * @returns Objeto con código OTP y payload, o null si no existe
   */
  async getSession(
    tokenId: string,
  ): Promise<{ code: string; payload: TwoFactorPayload } | null> {
    const session = await this.otpCoreService.getSession<TwoFactorPayload>(
      this.contextPrefix,
      tokenId,
    )

    if (!session) {
      return null
    }

    return {
      code: session.otpCode,
      payload: session.payload,
    }
  }
}

import { Injectable } from '@nestjs/common'
import { OtpCoreService } from '@core/security'
import { envs } from '@core/config'

/**
 * Payload que guardamos en el OTP para password reset
 */
interface PasswordResetPayload {
  userId: string
}

/**
 * Servicio de gestión de tokens para reset de contraseña
 *
 * ENFOQUE HÍBRIDO (OtpCoreService):
 * ===========================================
 * - Usa OtpCoreService (genérico) para gestión de sesiones OTP
 * - TokenId: String aleatorio de 64 caracteres hexadecimales (NO es JWT)
 * - Código OTP: Número aleatorio de 6 dígitos
 * - Almacenamiento: Redis con TTL
 * - Key: auth:reset-pw:{tokenId}
 * - Value: JSON {code, payload: {userId}}
 * - Un solo uso: Se elimina de Redis después de validación exitosa
 *
 * IMPORTANTE: "token" siempre se refiere a tokenId (64 caracteres), NO a JWT
 *
 * Ventajas de usar OtpCoreService:
 * - Consistencia con 2FA y otros flujos OTP
 * - Reutilización de código probado
 * - Mantenimiento centralizado
 * - API limpia y estandarizada
 *
 * Seguridad implementada:
 * - Un solo uso: Código se elimina después de validación exitosa
 * - TTL automático: Códigos expiran en 1 hora (3600 segundos)
 * - Rate limiting robusto (ver políticas)
 * - Control de intentos (máximo 3 intentos de verificación)
 *
 * Rate Limiting:
 * - Request: 10 intentos por email en 60 minutos
 * - Resend: Espera 60 segundos entre solicitudes
 * - Verificación: Máximo 3 intentos, luego se revoca el tokenId
 *
 * Variables de entorno:
 * - RESET_PASSWORD_TOKEN_EXPIRES_IN: Tiempo de expiración (default: "1h")
 * - TWO_FACTOR_CODE_LENGTH: Longitud del código OTP (default: 6)
 *
 * Flujo completo:
 * 1. Request Reset → generateToken() → Envía OTP por email
 * 2. Resend → getSession() → Reenvía el MISMO código
 * 3. Reset → validateToken() → Valida y actualiza password
 */
@Injectable()
export class PasswordResetTokenService {
  private readonly contextPrefix = 'reset-pw' // Prefijo para Redis
  private readonly codeLength = envs.twoFactor.codeLength // 6 dígitos
  private readonly tokenExpiry = envs.passwordReset.tokenExpires.seconds // 1 hora

  constructor(private readonly otpCoreService: OtpCoreService) {}

  /**
   * Genera un token de reset password usando OtpCoreService
   *
   * Flujo:
   * 1. Crea sesión OTP con OtpCoreService
   * 2. Devuelve tokenId (handle) y otpCode (código numérico)
   *
   * El OtpCoreService internamente:
   * - Genera tokenId aleatorio (256 bits = 64 chars hex)
   * - Genera código numérico aleatorio (6 dígitos)
   * - Almacena en Redis: auth:reset-pw:{tokenId} → JSON {code, payload: {userId}}
   *
   * @param userId - ID del usuario
   * @returns Objeto con tokenId (para frontend) y otpCode (para enviar por email)
   *
   * @example
   * const { tokenId, otpCode } = await service.generateToken('user-123')
   * // Enviar otpCode por email
   * // Retornar tokenId al frontend
   */
  async generateToken(userId: string): Promise<{
    tokenId: string
    otpCode: string
  }> {
    const payload: PasswordResetPayload = { userId }

    const { tokenId, otpCode } =
      await this.otpCoreService.createSession<PasswordResetPayload>(
        this.contextPrefix,
        payload,
        this.tokenExpiry,
        this.codeLength,
      )

    return {
      tokenId,
      otpCode,
    }
  }

  /**
   * Valida un código de reset password usando OtpCoreService
   *
   * Flujo de validación:
   * 1. Llama a OtpCoreService.validateSession() con tokenId y código
   * 2. Extrae el userId del payload almacenado en Redis
   * 3. Retorna isValid y payload con userId
   *
   * IMPORTANTE: Este método NO elimina el token automáticamente
   * El token debe ser eliminado manualmente después de:
   * - Validación exitosa (después de actualizar la contraseña)
   * - Exceso de intentos fallidos (3 intentos)
   *
   * Rate limiting se maneja en el Use Case (ResetPasswordUseCase)
   *
   * SEGURIDAD:
   * - NO requiere userId desde el frontend (más seguro)
   * - El userId está almacenado en el payload de Redis
   * - No se puede manipular el userId desde el cliente
   *
   * @param tokenId - TokenId de 64 caracteres
   * @param otpCode - Código numérico de 6 dígitos a validar
   * @returns Objeto con isValid y payload (contiene userId)
   *
   * @example
   * const { isValid, payload } = await service.validateToken(tokenId, '123456')
   * if (isValid && payload) {
   *   // Actualizar contraseña del usuario payload.userId
   * }
   */
  async validateToken(
    tokenId: string,
    otpCode: string,
  ): Promise<{ isValid: boolean; payload: PasswordResetPayload | null }> {
    const { isValid, payload } =
      await this.otpCoreService.validateSession<PasswordResetPayload>(
        this.contextPrefix,
        tokenId,
        otpCode,
      )

    if (!isValid || !payload) {
      return { isValid: false, payload: null }
    }

    return { isValid: true, payload }
  }

  /**
   * Elimina una sesión de reset password manualmente (Token Burning)
   *
   * Casos de uso:
   * - Después de validación exitosa y actualización de contraseña
   * - Cuando se exceden los intentos permitidos (3 intentos)
   * - Cuando el usuario solicita un nuevo reset (revoca el anterior - opcional)
   *
   * @param tokenId - TokenId a eliminar
   *
   * @example
   * // Después de resetear la contraseña exitosamente
   * await service.deleteSession(tokenId)
   */
  async deleteSession(tokenId: string): Promise<void> {
    await this.otpCoreService.deleteSession(this.contextPrefix, tokenId)
  }

  /**
   * Obtiene el payload sin validar el OTP
   * Útil para verificaciones previas o logs
   *
   * @param tokenId - TokenId (64 caracteres hexadecimales)
   * @returns Payload o null si no existe
   *
   * @example
   * const payload = await service.getPayload(tokenId)
   * if (!payload) {
   *   throw new BadRequestException('Sesión expirada')
   * }
   */
  async getPayload(tokenId: string): Promise<PasswordResetPayload | null> {
    return await this.otpCoreService.getPayload<PasswordResetPayload>(
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
   *
   * @example
   * // Para resend
   * const session = await service.getSession(tokenId)
   * if (!session) {
   *   throw new BadRequestException('Sesión expirada. Solicita un nuevo reset.')
   * }
   * // Reenviar el mismo código: session.otpCode
   */
  async getSession(tokenId: string): Promise<{
    otpCode: string
    payload: PasswordResetPayload
  } | null> {
    const session =
      await this.otpCoreService.getSession<PasswordResetPayload>(
        this.contextPrefix,
        tokenId,
      )

    if (!session) {
      return null
    }

    return {
      otpCode: session.otpCode,
      payload: session.payload,
    }
  }
}

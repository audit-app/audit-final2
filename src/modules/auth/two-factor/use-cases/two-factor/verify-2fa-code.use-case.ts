import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import { RateLimitService } from '@core/security'
import { TwoFactorTokenService } from '../../services/two-factor-token.service'
import {
  TrustedDeviceRepository,
  DeviceFingerprintService,
} from '../../../trusted-devices'
import { TokensService } from '../../../login/services/tokens.service'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { Verify2FACodeDto } from '../../dtos/verify-2fa-code.dto'
import type { ConnectionMetadata } from '@core/common'
import { TWO_FACTOR_CONFIG } from '../../config/two-factor.config'

/**
 * Use Case: Verificar código 2FA y generar tokens
 *
 * Responsabilidades:
 * - Controlar intentos de verificación (máximo 3)
 * - Validar el código contra Redis usando OtpCoreService
 * - Quemar token si excede intentos
 * - Agregar dispositivo como confiable si el usuario lo solicita
 * - Generar tokens JWT (accessToken + refreshToken)
 * - Retornar tokens para completar el login
 *
 * Flujo completo (similar a reset-password):
 * 1. Usuario hace login → recibe código 2FA por email + tokenId
 * 2. Usuario ingresa código → llama a este use case
 * 3. Incrementar contador de intentos
 * 4. Si excede 3 intentos → quemar token y lanzar excepción
 * 5. Validar código con OtpCoreService
 * 6. Si código inválido → informar intentos restantes
 * 7. Si código válido:
 *    - Quemar token (one-time use)
 *    - Agregar dispositivo como confiable (opcional)
 *    - Generar tokens JWT
 *    - Retornar tokens
 *
 * Seguridad implementada:
 * - Máximo 3 intentos de verificación (Token Burning)
 * - Código de un solo uso (se elimina después de validarse)
 * - Expira en 5 minutos (TTL automático)
 * - Token obligatorio para vincular sesión
 */
@Injectable()
export class Verify2FACodeUseCase {
  constructor(
    private readonly twoFactorTokenService: TwoFactorTokenService,
    private readonly trustedDeviceRepository: TrustedDeviceRepository,
    private readonly deviceFingerprintService: DeviceFingerprintService,
    private readonly tokensService: TokensService,
    private readonly rateLimitService: RateLimitService,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  /**
   * Ejecuta el flujo de verificación de código 2FA con control de intentos
   *
   * @param dto - DTO con userId, code, token, trustDevice (opcional), deviceFingerprint (opcional)
   * @param connection - Metadata de la conexión (IP, User-Agent)
   * @returns Resultado con tokens JWT o error
   * @throws BadRequestException si excede intentos o código inválido
   */
  async execute(
    dto: Verify2FACodeDto,
    connection: ConnectionMetadata,
  ): Promise<{
    valid: boolean
    message: string
    accessToken?: string
    refreshToken?: string
  }> {
    const CONTEXT = '2fa-verify'
    const ATTEMPTS_KEY = `attempts:${CONTEXT}:${dto.token}`
    const MAX_ATTEMPTS = TWO_FACTOR_CONFIG.rateLimit.verify.maxAttempts
    const WINDOW_MINUTES = TWO_FACTOR_CONFIG.rateLimit.verify.windowMinutes

    // ---------------------------------------------------------
    // 1. SEGURIDAD OTP: Control de Intentos (Token Burning)
    // ---------------------------------------------------------

    // Incrementamos el contador ANTES de validar nada
    const attempts = await this.rateLimitService.incrementAttempts(
      ATTEMPTS_KEY,
      WINDOW_MINUTES,
    )

    // Si supera 3 intentos, QUEMAMOS el token inmediatamente
    if (attempts > MAX_ATTEMPTS) {
      await this.twoFactorTokenService.deleteSession(dto.token) // Borra el token real
      await this.rateLimitService.resetAttempts(ATTEMPTS_KEY) // Limpia el contador

      throw new BadRequestException(
        'El código ha expirado por exceso de intentos. Solicita uno nuevo desde el login.',
      )
    }

    // ---------------------------------------------------------
    // 2. VALIDACIÓN DEL CÓDIGO
    // ---------------------------------------------------------

    const { isValid } = await this.twoFactorTokenService.validateCode(
      dto.userId,
      dto.code,
      dto.token,
    )

    if (!isValid) {
      const remaining = MAX_ATTEMPTS - attempts
      throw new BadRequestException(
        `Código incorrecto o expirado. Te quedan ${remaining} intentos.`,
      )
    }

    // ---------------------------------------------------------
    // 3. PROTOCOLO "TIERRA QUEMADA" (Seguridad)
    // ---------------------------------------------------------

    // A. Quemar el token usado (Para que no se pueda reusar)
    await this.twoFactorTokenService.deleteSession(dto.token)
    await this.rateLimitService.resetAttempts(ATTEMPTS_KEY)

    // ---------------------------------------------------------
    // 4. Lógica de Negocio (Trusted Device + Tokens JWT)
    // ---------------------------------------------------------

    // Si usuario quiere confiar en este dispositivo
    if (dto.trustDevice) {
      const fingerprint =
        dto.deviceFingerprint ||
        this.deviceFingerprintService.generateFingerprint(
          connection.rawUserAgent,
          connection.ip,
        )

      const deviceInfo = this.deviceFingerprintService.parseUserAgent(
        connection.rawUserAgent,
      )

      await this.trustedDeviceRepository.save(dto.userId, fingerprint, {
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device: deviceInfo.device,
        ip: connection.ip,
      })
    }

    // Generar tokens JWT ahora que verificó 2FA
    const user = await this.usersRepository.findById(dto.userId)

    if (!user) {
      throw new BadRequestException('Usuario no encontrado')
    }

    const { accessToken, refreshToken } =
      await this.tokensService.generateTokenPair(
        user,
        connection,
        false, // rememberMe: false (no hay opción de recordar en 2FA)
      )

    return {
      valid: true,
      message: 'Código verificado exitosamente. Sesión iniciada.',
      accessToken,
      refreshToken,
    }
  }
}

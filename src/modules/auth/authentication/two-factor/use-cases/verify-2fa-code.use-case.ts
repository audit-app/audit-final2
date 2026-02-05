import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import { RateLimitService } from '@core/security'
import { TwoFactorTokenService } from '../services/two-factor-token.service'
import { TrustedDeviceRepository } from '../../../session/devices'
import { TokensService } from '../../../core/services/tokens.service'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { Verify2FACodeDto } from '../dtos/verify-2fa-code.dto'
import type { ConnectionMetadata } from '@core/http'
import { ConnectionMetadataService } from '@core/http'
import { envs } from '@core/config'

/**
 * Use Case: Verificar código 2FA y generar tokens
 *
 * Responsabilidades:
 * - Controlar intentos de verificación (máximo 3)
 * - Validar el código contra Redis usando OtpCoreService
 * - Quemar token si agota los 3 intentos
 * - Agregar dispositivo como confiable si el usuario lo solicita
 * - Generar tokens JWT (accessToken + refreshToken)
 * - Retornar tokens para completar el login
 *
 * Flujo completo:
 * 1. Usuario hace login → recibe código 2FA por email + tokenId
 * 2. Usuario ingresa código → llama a este use case
 * 3. Verificar que el token existe en Redis (si no existe, rechazar sin incrementar contador)
 * 4. Incrementar contador de intentos (solo si el token existe)
 * 5. Validar código con OtpCoreService
 * 6. Si código inválido:
 *    - Si agotó los 3 intentos → quemar token y lanzar excepción
 *    - Si tiene intentos restantes → informar cuántos quedan
 * 7. Si código válido:
 *    - Quemar token (one-time use)
 *    - Limpiar contador de intentos
 *    - Agregar dispositivo como confiable (opcional)
 *    - Generar tokens JWT
 *    - Retornar tokens
 *
 * Seguridad implementada:
 * - Verificación de existencia del token antes de incrementar contador (evita spam)
 * - Exactamente 3 intentos de verificación (Token Burning después del 3er fallo)
 * - Código de un solo uso (se elimina después de validarse o agotar intentos)
 * - Expira en 5 minutos (TTL automático)
 * - Token obligatorio para vincular sesión
 */
@Injectable()
export class Verify2FACodeUseCase {
  constructor(
    private readonly twoFactorTokenService: TwoFactorTokenService,
    private readonly trustedDeviceRepository: TrustedDeviceRepository,
    private readonly connectionMetadataService: ConnectionMetadataService,
    private readonly tokensService: TokensService,
    private readonly rateLimitService: RateLimitService,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  /**
   * Ejecuta el flujo de verificación de código 2FA con control de intentos
   *
   * CAMBIO IMPORTANTE:
   * - Ya NO requiere userId desde el frontend
   * - El userId se extrae del payload almacenado en Redis
   * - Más seguro: el userId no puede ser manipulado por el cliente
   *
   * @param dto - DTO con token (64 chars), code (6 dígitos), trustDevice (opcional)
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
    accessToken: string
    refreshToken: string
    rememberMe: boolean // Necesario para setear cookie de refreshToken con TTL correcto
    deviceId?: string
  }> {
    const CONTEXT = '2fa-verify'
    const ATTEMPTS_KEY = `attempts:${CONTEXT}:${dto.token}`
    const MAX_ATTEMPTS = envs.twoFactor.verifyMaxAttempts
    const WINDOW_MINUTES = envs.twoFactor.verifyWindow.minutes

    // ---------------------------------------------------------
    // 1. VERIFICAR QUE EL TOKEN EXISTE (antes de incrementar contador)
    // ---------------------------------------------------------

    // Verificar si el token existe en Redis ANTES de incrementar el contador
    const sessionExists = await this.twoFactorTokenService.getPayload(dto.token)

    if (!sessionExists) {
      // Token no existe o ya fue revocado/expiró
      throw new BadRequestException(
        'El código de verificación ha expirado o ya fue usado. Por favor, inicia sesión nuevamente.',
      )
    }

    // ---------------------------------------------------------
    // 2. SEGURIDAD OTP: Control de Intentos (Token Burning)
    // ---------------------------------------------------------

    // Incrementamos el contador solo si el token existe
    const attempts = await this.rateLimitService.incrementAttempts(
      ATTEMPTS_KEY,
      WINDOW_MINUTES,
    )

    // ---------------------------------------------------------
    // 3. VALIDACIÓN DEL CÓDIGO
    // ---------------------------------------------------------

    const { isValid, payload } = await this.twoFactorTokenService.validateCode(
      dto.token,
      dto.code,
    )

    if (!isValid || !payload) {
      // Código incorrecto: Verificar si agotó los intentos permitidos
      if (attempts >= MAX_ATTEMPTS) {
        // Agotó intentos → QUEMAR TOKEN
        await this.twoFactorTokenService.deleteSession(dto.token)
        await this.rateLimitService.resetAttempts(ATTEMPTS_KEY)

        throw new BadRequestException(
          `Has agotado los ${MAX_ATTEMPTS} intentos permitidos. El código ha sido revocado. Inicia sesión nuevamente.`,
        )
      }

      // Todavía tiene intentos
      const remaining = MAX_ATTEMPTS - attempts
      throw new BadRequestException(
        `Código incorrecto o expirado. Te quedan ${remaining} ${remaining === 1 ? 'intento' : 'intentos'}.`,
      )
    }

    // Extraer userId del payload (más seguro que recibirlo del frontend)
    const userId = payload.userId

    // ---------------------------------------------------------
    // 3. CÓDIGO VÁLIDO: Quemar token (one-time use)
    // ---------------------------------------------------------

    // Quemar el token usado (para que no se pueda reusar)
    await this.twoFactorTokenService.deleteSession(dto.token)
    // Limpiar contador de intentos (ya no es necesario)
    await this.rateLimitService.resetAttempts(ATTEMPTS_KEY)

    // ---------------------------------------------------------
    // 4. Lógica de Negocio (Trusted Device + Tokens JWT)
    // ---------------------------------------------------------

    // Capturar deviceId si el usuario quiere confiar en este dispositivo
    let deviceId: string | undefined

    if (dto.trustDevice) {
      const fingerprint = this.connectionMetadataService.generateFingerprint(
        connection.rawUserAgent,
        connection.ip,
      )

      const deviceInfo = this.connectionMetadataService.parse(connection)

      // Guardar dispositivo confiable y obtener deviceId (UUID)
      deviceId = await this.trustedDeviceRepository.saveDevice(userId, {
        fingerprint,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device: deviceInfo.device,
        ip: connection.ip,
      })
    }

    // Generar tokens JWT ahora que verificó 2FA
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      throw new BadRequestException('Usuario no encontrado')
    }

    // Usar rememberMe del payload (propagado desde el login)
    const rememberMe = payload.rememberMe || false

    const { accessToken, refreshToken } =
      await this.tokensService.generateTokenPair(user, connection, rememberMe)

    return {
      valid: true,
      message: 'Código verificado exitosamente. Sesión iniciada.',
      accessToken,
      refreshToken,
      deviceId,
      rememberMe,
    }
  }
}

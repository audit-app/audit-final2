import { Injectable, Inject } from '@nestjs/common'
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

/**
 * Use Case: Verificar código 2FA y generar tokens
 *
 * Responsabilidades:
 * - Validar el código contra Redis (one-time use)
 * - Agregar dispositivo como confiable si el usuario lo solicita
 * - Generar tokens JWT (accessToken + refreshToken)
 * - Retornar tokens para completar el login
 *
 * Flujo completo:
 * 1. Usuario hace login → recibe código 2FA por email
 * 2. Usuario ingresa código → llama a este use case
 * 3. Validamos código (se elimina de Redis)
 * 4. Si usuario marca "confiar en dispositivo" → agregar a trusted devices
 * 5. Generar tokens JWT y retornar
 *
 * Seguridad:
 * - Código de un solo uso (se elimina después de validarse)
 * - Expira en 5 minutos
 * - Token obligatorio para vincular sesión
 */
@Injectable()
export class Verify2FACodeUseCase {
  constructor(
    private readonly twoFactorTokenService: TwoFactorTokenService,
    private readonly trustedDeviceRepository: TrustedDeviceRepository,
    private readonly deviceFingerprintService: DeviceFingerprintService,
    private readonly tokensService: TokensService,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  /**
   * Ejecuta el flujo de verificación de código 2FA
   *
   * @param dto - DTO con userId, code, token, trustDevice (opcional), deviceFingerprint (opcional)
   * @param connection - Metadata de la conexión (IP, User-Agent)
   * @returns Resultado con tokens JWT o error
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
    // 1. Validar código (one-time use, se elimina de Redis)
    const isValid = await this.twoFactorTokenService.validateCode(
      dto.userId,
      dto.code,
      dto.token,
    )

    if (!isValid) {
      return {
        valid: false,
        message:
          'Código inválido o expirado. Por favor, solicite un nuevo código.',
      }
    }

    // 2. NUEVO: Si usuario quiere confiar en este dispositivo
    if (dto.trustDevice) {
      // Generar fingerprint si no se proporcionó
      const fingerprint =
        dto.deviceFingerprint ||
        this.deviceFingerprintService.generateFingerprint(
          connection.rawUserAgent,
          connection.ip,
        )

      // Parsear User-Agent para obtener información del dispositivo
      const deviceInfo = this.deviceFingerprintService.parseUserAgent(
        connection.rawUserAgent,
      )

      // Agregar dispositivo como confiable (TTL: 90 días)
      await this.trustedDeviceRepository.save(dto.userId, fingerprint, {
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device: deviceInfo.device,
        ip: connection.ip,
      })
    }

    // 3. Generar tokens JWT ahora que verificó 2FA
    const user = await this.usersRepository.findById(dto.userId)

    if (!user) {
      return {
        valid: false,
        message: 'Usuario no encontrado',
      }
    }

    const { accessToken, refreshToken } =
      await this.tokensService.generateTokenPair(user, connection)

    return {
      valid: true,
      message: 'Código verificado exitosamente. Sesión iniciada.',
      accessToken,
      refreshToken,
    }
  }
}

import { Injectable, Inject } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import type { Request } from 'express'
import { TwoFactorTokenService } from '../../services/two-factor-token.service'
import { TrustedDeviceService } from '../../../trusted-devices'
import { TokensService } from '../../../login/services/tokens.service'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { Verify2FACodeDto } from '../../dtos/verify-2fa-code.dto'

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
    private readonly trustedDeviceService: TrustedDeviceService,
    private readonly tokensService: TokensService,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  /**
   * Ejecuta el flujo de verificación de código 2FA
   *
   * @param dto - DTO con userId, code, token, trustDevice (opcional), deviceFingerprint (opcional)
   * @returns Resultado con tokens JWT o error
   */
  async execute(dto: Verify2FACodeDto): Promise<{
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
      const userAgent = this.request.headers['user-agent'] || 'unknown'
      const ip = this.request.ip || 'unknown'

      // Generar fingerprint si no se proporcionó
      const fingerprint =
        dto.deviceFingerprint ||
        this.trustedDeviceService.generateFingerprint(userAgent, ip)

      // Parsear User-Agent para obtener información del dispositivo
      const deviceInfo = this.trustedDeviceService.parseUserAgent(userAgent)

      // Agregar dispositivo como confiable (TTL: 90 días)
      await this.trustedDeviceService.addTrustedDevice(dto.userId, fingerprint, {
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device: deviceInfo.device,
        ip,
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

    // Obtener información del request
    const ip = this.request.ip || 'Unknown'
    const userAgent = this.request.headers['user-agent'] || 'Unknown'

    const { accessToken, refreshToken } =
      await this.tokensService.generateTokenPair(user, ip, userAgent)

    return {
      valid: true,
      message: 'Código verificado exitosamente. Sesión iniciada.',
      accessToken,
      refreshToken,
    }
  }
}

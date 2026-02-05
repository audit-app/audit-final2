import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { TokensService } from '../../../core/services'
import type { ConnectionMetadata } from '@core/http'
import { ConnectionMetadataService } from '@core/http'
import type { LoginResponseDto } from '../../local/dtos'
import {
  UserNotActiveException,
  InvalidCredentialsException,
} from '../../../core/exceptions'
import { TwoFactorTokenService } from '../../two-factor'
import { TrustedDeviceRepository } from '../../../session/devices'
import { EmailEventService } from '@core/email'
import type { GoogleUser } from '../../../core/interfaces'
import { Transactional } from '@core/database'
import { envs } from '@core'

/**
 * Google Login Use Case
 *
 * IMPORTANTE: Google OAuth NO registra usuarios nuevos.
 * Solo sirve como método alternativo de autenticación para usuarios YA REGISTRADOS.
 *
 * FLUJO:
 * 1. Google autentica al usuario y proporciona su email
 * 2. Buscar usuario en BD por email
 * 3. Si NO existe → RECHAZAR (no permitir login)
 * 4. Si existe → Validar (isActive)
 * 5. Vincular cuenta de Google (si no está vinculada)
 * 6. Aplicar lógica de 2FA si está habilitado (igual que login normal)
 * 7. Generar tokens JWT (igual que login normal)
 *
 * IMPORTANTE:
 * - Solo usamos Google para VERIFICAR la identidad
 * - NO usamos los tokens de Google
 * - NO registramos usuarios nuevos
 * - Generamos nuestros propios JWT con TokensService
 * - Reutiliza TODA la lógica del login normal (2FA, trusted devices, etc.)
 */

@Injectable()
export class GoogleLoginUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly tokensService: TokensService,
    private readonly twoFactorTokenService: TwoFactorTokenService,
    private readonly trustedDeviceRepository: TrustedDeviceRepository,
    private readonly connectionMetadataService: ConnectionMetadataService,
    private readonly emailEventService: EmailEventService,
  ) {}

  @Transactional()
  async execute(
    googleUser: GoogleUser,
    connection: ConnectionMetadata,
    deviceId?: string,
  ): Promise<{
    response: LoginResponseDto
    refreshToken?: string
  }> {
    // 1. VALIDAR QUE GOOGLE NOS DIO UN EMAIL
    if (!googleUser.email) {
      throw new BadRequestException(
        'Google no proporcionó un email. Verifica los permisos.',
      )
    }

    // 2. BUSCAR USUARIO POR EMAIL
    const user = await this.usersRepository.findByUsernameOrEmailWithPassword(
      googleUser.email,
    )

    // 3. SI NO EXISTE → RECHAZAR (NO REGISTRAR USUARIO NUEVO)
    if (!user) {
      throw new InvalidCredentialsException()
    }

    // 4. VINCULAR CUENTA DE GOOGLE (si no está vinculada)
    if (!user.providerId) {
      // Primera vez que usa Google → vincular cuenta
      // CASO 1: Nunca hizo login → password = null, isTemporaryPassword = false
      // CASO 2: Ya hizo login local → mantener password y flags
      user.linkGoogleAccount(googleUser.providerId)
      await this.usersRepository.save(user)
    } else if (user.providerId !== googleUser.providerId) {
      // Cuenta ya vinculada a OTRA cuenta de Google → rechazar
      throw new BadRequestException(
        'Este email ya está vinculado a otra cuenta de Google.',
      )
    }
    // Si providerId coincide → no hacer nada (ya está vinculado correctamente)

    // 5. VALIDACIONES (igual que login normal)
    if (!user.isActive) {
      throw new UserNotActiveException()
    }

    // Marcar primer login si es la primera vez
    if (!user.firstLoginAt) {
      user.markFirstLogin()
      await this.usersRepository.save(user)
    }

    // 6. LÓGICA DE 2FA (igual que login normal)
    if (user.isTwoFactorEnabled) {
      const userAgent = connection.rawUserAgent || 'unknown'
      const ip = connection.ip

      // Generar fingerprint actual del dispositivo
      const currentFingerprint =
        this.connectionMetadataService.generateFingerprint(userAgent, ip)

      // Verificar si el dispositivo es confiable usando el deviceId (UUID) de la cookie
      let isTrusted = false
      if (deviceId) {
        isTrusted = await this.trustedDeviceRepository.validateDevice(
          user.id,
          deviceId,
          currentFingerprint,
        )
      }

      if (!isTrusted) {
        // Dispositivo no confiable → Requiere 2FA
        const { code, token } = await this.twoFactorTokenService.generateCode(
          user.id,
          true, //rememberMe true
        )

        // Enviar código por email (asíncrono vía eventos, no bloqueante)
        this.emailEventService.emitSend2FACode({
          to: user.email,
          userName: user.username,
          code,
          expiresInMinutes: envs.twoFactor.codeExpires.minutes,
        })

        // Retornar respuesta indicando que requiere 2FA
        return {
          response: {
            accessToken: '', // Vacío hasta que verifique el código 2FA
            require2FA: true,
            twoFactorToken: token,
          },
        }
      }

      // Si es trusted, validateDevice ya actualizó el lastUsedAt
    }

    // 7. GENERAR TOKENS (Flujo normal o Trusted Device)
    const { accessToken, refreshToken } =
      await this.tokensService.generateTokenPair(user, connection, true)

    return {
      response: {
        accessToken,
      },
      refreshToken,
    }
  }
}

import { Injectable, Inject } from '@nestjs/common'
import { PasswordHashService } from '@core/security'
import { EmailEventService } from '@core/email'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { TwoFactorTokenService } from '../../two-factor'
import {
  TrustedDeviceRepository,
  DeviceFingerprintService,
} from '../../../session/devices'
import { LoginRateLimitPolicy } from '../../../core/policies'
import type { LoginDto, LoginResponseDto } from '../dtos'
import {
  InvalidCredentialsException,
  UserNotActiveException,
  EmailNotVerifiedException,
} from '../../../core/exceptions'

import { ConnectionMetadata } from '@core/common'
import { TokensService } from '../../../core/services'

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly tokensService: TokensService,
    private readonly loginRateLimitPolicy: LoginRateLimitPolicy,
    private readonly twoFactorTokenService: TwoFactorTokenService,
    private readonly trustedDeviceRepository: TrustedDeviceRepository,
    private readonly deviceFingerprintService: DeviceFingerprintService,
    private readonly emailEventService: EmailEventService,
  ) {}

  async execute(
    dto: LoginDto,
    connection: ConnectionMetadata,
    deviceId?: string, // UUID del dispositivo confiable (de la cookie)
  ): Promise<{
    response: LoginResponseDto
    refreshToken?: string
  }> {
    // 1. BUSCAR USUARIO EN BASE DE DATOS
    // No verificamos rate limit todavía para no ensuciar Redis con emails falsos.
    const user = await this.usersRepository.findByUsernameOrEmailWithPassword(
      dto.usernameOrEmail,
    )

    // 2. ESCENARIO: USUARIO NO EXISTE (Protección Anti-Enumeración)
    if (!user) {
      // NO tocamos Redis.
      // Opcional: Podrías poner un 'await TimeUtil.sleep(random)' aquí para mitigar Timing Attacks

      throw new InvalidCredentialsException()
    }

    // 3. ESCENARIO: USUARIO EXISTE -> AHORA SÍ PROTEGEMOS LA CUENTA

    // a) Verificar si la cuenta ya está bloqueada por muchos intentos previos
    // Esto lanzará TooManyAttemptsException si ya excedió el límite.
    await this.loginRateLimitPolicy.checkLimitOrThrow(user.email)

    // b) Verificar integridad del usuario (sin password)
    if (!user.password) {
      // ✅ SEGURIDAD: NO revelar que el usuario existe pero no tiene password
      // Esto puede ocurrir si:
      // 1. El usuario no completó el setup después de verificar email
      // 2. El usuario solo usa Google OAuth (password = null)
      // Usamos InvalidCredentialsException (mensaje genérico) para evitar user enumeration
      await this.loginRateLimitPolicy.registerFailure(user.email)
      throw new InvalidCredentialsException()
    }

    // 4. VERIFICAR CONTRASEÑA
    const isPasswordValid = await this.passwordHashService.verify(
      dto.password,
      user.password,
    )

    if (!isPasswordValid) {
      // c) Password Incorrecto -> CASTIGAR EN REDIS
      // Incrementamos el contador para este email específico
      await this.loginRateLimitPolicy.registerFailure(user.email)
      throw new InvalidCredentialsException()
    }

    // 5. VALIDACIONES DE ESTADO (Ya pasó la seguridad, validamos negocio)
    if (!user.isActive) {
      throw new UserNotActiveException()
    }

    if (!user.emailVerified) {
      throw new EmailNotVerifiedException()
    }

    // 6. LOGIN EXITOSO -> LIMPIEZA
    // Borramos el contador de intentos fallidos porque entró correctamente
    await this.loginRateLimitPolicy.clearRecords(user.email)

    // -----------------------------------------------------------------------
    // 7. LÓGICA DE 2FA
    // -----------------------------------------------------------------------
    if (user.isTwoFactorEnabled) {
      const userAgent = connection.rawUserAgent || 'unknown'
      const ip = connection.ip

      // Generar fingerprint actual del dispositivo
      const currentFingerprint =
        this.deviceFingerprintService.generateFingerprint(userAgent, ip)

      // Verificar si el dispositivo es confiable usando el deviceId (UUID) de la cookie
      let isTrusted = false
      if (deviceId) {
        // El navegador envió una cookie con deviceId (UUID) - verificar si es válido
        isTrusted = await this.trustedDeviceRepository.validateDevice(
          user.id,
          deviceId,
          currentFingerprint,
        )
      }

      if (!isTrusted) {
        // Dispositivo no confiable -> Requiere 2FA
        // Generar código OTP y token temporal (propagando rememberMe)
        const { code, token } = await this.twoFactorTokenService.generateCode(
          user.id,
          dto.rememberMe, // Propagar rememberMe al payload de Redis
        )

        // Enviar código por email (asíncrono vía eventos, no bloqueante)
        this.emailEventService.emitSend2FACode({
          to: user.email,
          userName: user.username,
          code,
          expiresInMinutes: 5,
        })

        // Retornar respuesta indicando que requiere 2FA
        // NO incluye datos del usuario (usar /auth/me después de verificar 2FA)
        return {
          response: {
            accessToken: '', // Vacío hasta que verifique el código 2FA
            require2FA: true,
            twoFactorToken: token, // Token de 64 caracteres para validación
          },
          // NO se genera refreshToken hasta verificar 2FA
        }
      }

      // Si es trusted, validateDevice ya actualizó el lastUsedAt
    }

    // 8. GENERAR TOKENS (Flujo normal o Trusted Device)
    const { accessToken, refreshToken } =
      await this.tokensService.generateTokenPair(
        user,
        connection,
        dto.rememberMe,
      )

    // Retornar solo accessToken
    // El frontend debe llamar a /auth/me para obtener los datos del usuario
    return {
      response: {
        accessToken,
      },
      refreshToken,
    }
  }
}

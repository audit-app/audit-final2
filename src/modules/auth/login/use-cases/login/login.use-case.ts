import { Injectable, Inject } from '@nestjs/common'
import { PasswordHashService } from '@core/security'
import { EmailService } from '@core/email'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
// import { TwoFactorTokenService } from '../../../two-factor'
// import { TrustedDeviceRepository, DeviceFingerprintService } from '../../../trusted-devices'
import { LoginRateLimitPolicy } from '../../policies'
import type { LoginDto, LoginResponseDto } from '../../dtos'
import {
  InvalidCredentialsException,
  UserNotActiveException,
  EmailNotVerifiedException,
} from '../../exceptions'

import { ConnectionMetadata } from '@core/common'
import { TokensService } from '../../services'

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly tokensService: TokensService,
    // Ahora esta policy hereda de BaseRateLimitPolicy y solo pide el identificador
    private readonly loginRateLimitPolicy: LoginRateLimitPolicy,
    // private readonly twoFactorTokenService: TwoFactorTokenService,
    // private readonly trustedDeviceRepository: TrustedDeviceRepository,
    // private readonly deviceFingerprintService: DeviceFingerprintService,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    dto: LoginDto,
    connection: ConnectionMetadata,
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
      // Si el usuario existe pero no tiene password (ej. registro incompleto),
      // técnicamente es un fallo de credenciales o estado.
      throw new EmailNotVerifiedException()
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
    // 7. LÓGICA DE 2FA (Pendiente de descomentar e integrar)
    // -----------------------------------------------------------------------
    /*
    if (user.isTwoFactorEnabled) {
      const userAgent = connection.userAgent || 'unknown';
      const ip = connection.ip;

      const fingerprint = dto.deviceFingerprint || 
        this.deviceFingerprintService.generateFingerprint(userAgent, ip);

      const isTrusted = await this.trustedDeviceRepository.isTrusted(user.id, fingerprint);

      if (!isTrusted) {
         // Generar código y enviar email...
         // Retornar respuesta require2FA...
         return { ... }
      }
      
      // Si es trusted, actualizamos fecha y seguimos al token generation
      await this.trustedDeviceRepository.updateLastUsed(user.id, fingerprint);
    }
    */

    // 8. GENERAR TOKENS (Flujo normal o Trusted Device)
    const { accessToken, refreshToken } =
      await this.tokensService.generateTokenPair(
        user,
        connection,
        dto.rememberMe,
      )

    return {
      response: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          roles: user.roles,
          organizationId: user.organizationId,
          status: user.isActive,
        },
      },
      refreshToken,
    }
  }
}

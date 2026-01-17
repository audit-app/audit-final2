import { Injectable, Inject } from '@nestjs/common'
import { PasswordHashService } from '@core/security'
import { EmailService } from '@core/email'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
//import { TwoFactorTokenService } from '../../../two-factor'
//import { TrustedDeviceRepository, DeviceFingerprintService } from '../../../trusted-devices'
import { LoginRateLimitPolicy } from '../../policies'
import type { LoginDto, LoginResponseDto } from '../../dtos'
import {
  InvalidCredentialsException,
  UserNotActiveException,
  EmailNotVerifiedException,
} from '../../exceptions'
import { UserStatus } from '../../../../users/entities/user.entity'
import { ConnectionMetadata } from '@core/common'
import { TokensService } from '../../services'

/**
 * Use Case: Login de usuario con 2FA condicional
 *
 * Responsabilidades:
 * - Verificar rate limiting (via policy)
 * - Validar credenciales del usuario
 * - Verificar estado activo y email verificado
 * - Verificar 2FA condicional (solo si usuario lo habilita Y dispositivo no es confiable)
 * - Generar par de tokens (access + refresh) o requerir código 2FA
 * - Retornar información del usuario
 *
 * Flujo de 2FA condicional:
 * 1. Si usuario NO tiene 2FA habilitado → generar tokens directamente
 * 2. Si usuario tiene 2FA habilitado:
 *    a. Verificar si dispositivo es confiable (trusted)
 *    b. Si es confiable → bypass (generar tokens directamente)
 *    c. Si NO es confiable → generar código 2FA y enviar email
 *
 * Seguridad:
 * - Rate limiting dual: por IP (10/15min) y por usuario (5/15min)
 * - Incrementa contadores en fallos
 * - Resetea contadores en éxito
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly tokensService: TokensService,
    private readonly loginRateLimitPolicy: LoginRateLimitPolicy,
    //private readonly twoFactorTokenService: TwoFactorTokenService,
    //private readonly trustedDeviceRepository: TrustedDeviceRepository,
    //private readonly deviceFingerprintService: DeviceFingerprintService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Ejecuta el flujo de login completo con 2FA condicional
   *
   * @param dto - Credenciales de login (con opcional deviceFingerprint)
   * @param ip - Dirección IP del usuario (para rate limiting y fingerprint)
   * @returns Response con access token e info del usuario, más refresh token (o indicación de 2FA requerido)
   * @throws TooManyAttemptsException si excede intentos
   * @throws InvalidCredentialsException si credenciales inválidas
   * @throws UserNotActiveException si usuario no está activo
   * @throws EmailNotVerifiedException si email no está verificado
   */
  async execute(
    dto: LoginDto,
    connection: ConnectionMetadata,
  ): Promise<{
    response: LoginResponseDto
    refreshToken?: string
  }> {
    const { ip } = connection
    // 1. Verificar rate limiting (IP y usuario)
    await this.loginRateLimitPolicy.checkLimits(ip, dto.usernameOrEmail)

    // 2. Buscar usuario (por email o username) incluyendo password
    const user = await this.usersRepository.findByUsernameOrEmailWithPassword(
      dto.usernameOrEmail,
    )

    if (!user) {
      // Incrementar contadores y lanzar excepción
      await this.loginRateLimitPolicy.incrementAttempts(ip, dto.usernameOrEmail)
      throw new InvalidCredentialsException()
    }

    // 3. Verificar contraseña
    // Si el usuario no ha verificado su email, password será null
    if (!user.password) {
      await this.loginRateLimitPolicy.incrementAttempts(ip, dto.usernameOrEmail)
      throw new EmailNotVerifiedException()
    }

    const isPasswordValid = await this.passwordHashService.verify(
      dto.password,
      user.password,
    )

    if (!isPasswordValid) {
      // Incrementar contadores y lanzar excepción
      await this.loginRateLimitPolicy.incrementAttempts(ip, dto.usernameOrEmail)
      throw new InvalidCredentialsException()
    }

    // 4. Verificar estado activo y email verificado
    if (user.status !== UserStatus.ACTIVE) {
      throw new UserNotActiveException(user.status)
    }

    if (!user.emailVerified) {
      throw new EmailNotVerifiedException()
    }

    // 5. Login exitoso - resetear contadores
    await this.loginRateLimitPolicy.resetAttempts(ip, dto.usernameOrEmail)

    // 6. NUEVO: Verificar 2FA condicional
    /*   if (user.isTwoFactorEnabled) {
      // Usuario tiene 2FA habilitado → verificar dispositivo
      const userAgent = this.request.headers['user-agent'] || 'unknown'

      // Generar fingerprint si el cliente no lo envió
      const fingerprint =
        dto.deviceFingerprint ||
        this.deviceFingerprintService.generateFingerprint(userAgent, ip)

      // Verificar si es dispositivo confiable
      const isTrusted = await this.trustedDeviceRepository.isTrusted(
        user.id,
        fingerprint,
      )

      if (isTrusted) {
        // BYPASS 2FA: Dispositivo confiable
        // Actualizar última fecha de uso del dispositivo
        await this.trustedDeviceRepository.updateLastUsed(user.id, fingerprint)

        // Generar tokens JWT directamente
        const { accessToken, refreshToken } =
          await this.tokensService.generateTokenPair(user, connection)

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
              status: user.status,
            },
          },
          refreshToken,
        }
      }

      // Dispositivo NO confiable: Requerir código 2FA
      const { code, token } = await this.twoFactorTokenService.generateCode(
        user.id,
      )

      // Enviar código por email
      await this.emailService.sendTwoFactorCode({
        to: user.email,
        userName: user.fullName,
        code,
        expiresInMinutes: 5,
      })

      // Retornar indicando que requiere 2FA
      return {
        response: {
          accessToken: '', // Vacío hasta verificar 2FA
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            roles: user.roles,
            organizationId: user.organizationId,
            status: user.status,
          },
          require2FA: true,
          twoFactorToken: token, // Cliente debe guardar esto
          deviceFingerprint: fingerprint, // Cliente debe guardar para verificación
        },
        // NO hay refreshToken hasta verificar 2FA
      }
    } */

    // 7. Usuario NO tiene 2FA habilitado: Flujo normal
    const { accessToken, refreshToken } =
      await this.tokensService.generateTokenPair(user, connection)

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
          status: user.status,
        },
      },
      refreshToken,
    }
  }
}

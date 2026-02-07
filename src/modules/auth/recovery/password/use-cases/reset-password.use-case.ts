import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import {
  PasswordHashService,
  RateLimitService,
} from '@core/security'
import { TrustedDeviceRepository } from '../../../session/devices'
import { TokensService } from '../../../core/services/tokens.service'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { PasswordResetTokenService } from '../services'

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly trustedDeviceRepository: TrustedDeviceRepository,
    private readonly tokensService: TokensService,
    private readonly passwordResetTokenService: PasswordResetTokenService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async execute(
    tokenId: string,
    otpCode: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const ATTEMPTS_KEY = `attempts:reset-pw:${tokenId}`

    // ---------------------------------------------------------
    // 1. SEGURIDAD OTP: Control de Intentos (Token Burning)
    // ---------------------------------------------------------
    const sessionExists = await this.passwordResetTokenService.getPayload(tokenId)

    if (!sessionExists) {
      // Token no existe o ya fue revocado/expiró
      throw new BadRequestException(
        'El código de verificación ha expirado o ya fue usado. Por favor, inicia sesión nuevamente.',
      )
    }

    // Incrementamos el contador ANTES de validar nada.
    // Usamos una ventana corta (ej. 15 min), suficiente para el proceso.
    const attempts = await this.rateLimitService.incrementAttempts(
      ATTEMPTS_KEY,
      15,
    )

    // Si supera 3 intentos, QUEMAMOS el token inmediatamente.
    if (attempts > 3) {
      await this.passwordResetTokenService.deleteSession(tokenId) // Borra el token real
      await this.rateLimitService.resetAttempts(ATTEMPTS_KEY) // Limpia el contador

      throw new BadRequestException(
        'El código ha expirado por exceso de intentos. Solicita uno nuevo.',
      )
    }

    // ---------------------------------------------------------
    // 2. VALIDACIÓN DEL CÓDIGO
    // ---------------------------------------------------------

    // Recuperamos el payload (userId) validando el OTP
    const { isValid, payload } = await this.passwordResetTokenService.validateToken(
      tokenId,
      otpCode,
    )

    if (!isValid || !payload) {
      // Feedback explícito al usuario
      const remaining = 3 - attempts
      throw new BadRequestException(
        `Código incorrecto o expirado. Te quedan ${remaining} intentos.`,
      )
    }

    const userId = payload.userId

    // ---------------------------------------------------------
    // 3. Lógica de Negocio (Usuario y Password)
    // ---------------------------------------------------------

    const user = await this.usersRepository.findById(userId)

    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    // Hash de la nueva contraseña
    const hashedPassword = await this.passwordHashService.hash(newPassword)

    // Actualizar contraseña en BD
    await this.usersRepository.update(user.id, { password: hashedPassword })

    // ---------------------------------------------------------
    // 4. PROTOCOLO "TIERRA QUEMADA" (Seguridad Máxima)
    // ---------------------------------------------------------

    // A. Quemar el token usado (Para que no se pueda reusar en un Replay Attack)
    await this.passwordResetTokenService.deleteSession(tokenId)
    await this.rateLimitService.resetAttempts(ATTEMPTS_KEY)

    // B. Revocar TODOS los dispositivos confiables
    // Obliga a usar 2FA la próxima vez en cualquier dispositivo.
    await this.trustedDeviceRepository.deleteAllForUser(userId)

    // C. Revocar TODAS las sesiones activas (Refresh Tokens)
    // Expulsa al usuario (y al atacante) de todos los navegadores/apps.
    await this.tokensService.revokeAllUserTokens(userId)

    // Incrementamos la versión del token (si implementaste lo que hablamos antes)
    // await this.usersRepository.incrementTokenVersion(userId);

    return {
      message:
        'Contraseña actualizada. Se han cerrado todas las sesiones por seguridad.',
    }
  }
}

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { EmailEventService } from '@core/email'
import { OtpCoreService } from '@core/security'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { ResendResetPasswordRateLimitPolicy } from '../../../core/policies/resend-reset-password-rate-limit.policy'

@Injectable()
export class ResendResetPasswordUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly otpCoreService: OtpCoreService,
    private readonly emailEventService: EmailEventService,
    private readonly resendRateLimitPolicy: ResendResetPasswordRateLimitPolicy,
  ) {}

  /**
   * Ejecuta el flujo de reenvío de código de reset password con cooldown
   *
   * @param tokenId - TokenId de 64 caracteres
   * @returns Mensaje de confirmación (el tokenId NO cambia)
   * @throws NotFoundException si el usuario no existe
   * @throws BadRequestException si la sesión OTP no existe o expiró
   * @throws TooManyAttemptsException si debe esperar cooldown
   */
  async execute(tokenId: string): Promise<{ message: string }> {
    // 1. Obtener sesión OTP existente de Redis
    const session = await this.otpCoreService.getSession<{ userId: string }>(
      'reset-pw',
      tokenId,
    )

    if (!session) {
      throw new BadRequestException(
        'Sesión de reset password no encontrada o expirada. Por favor, solicita un nuevo código.',
      )
    }

    const { otpCode, payload } = session
    const userId = payload.userId

    // 2. Buscar usuario
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    // 3. RATE LIMITING: Verificar cooldown (60 segundos)
    // Lanza TooManyAttemptsException si debe esperar
    await this.resendRateLimitPolicy.checkCooldownOrThrow(user.id)

    // 4. Reenviar el MISMO código por email (asíncrono, no bloqueante)
    this.emailEventService.emitSendResetPassword({
      to: user.email,
      userName: user.username,
      resetLink: otpCode,
      expiresInMinutes: 60,
    })

    // 5. Marcar intento de resend (iniciar cooldown de 60 segundos)
    await this.resendRateLimitPolicy.markResendAttempt(user.email)

    // 6. Retornar mensaje de confirmación
    return {
      message:
        'Código de reset password reenviado. Espera 60 segundos antes de solicitar otro.',
    }
  }
}

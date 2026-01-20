import { Injectable, Inject } from '@nestjs/common'
import { EmailEventService } from '@core/email'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { RequestResetPasswordRateLimitPolicy } from '../../policies'
import { OtpCoreService } from '@core/security'

// Definimos el Payload que guardaremos en el OTP para este caso
interface ResetPasswordPayload {
  userId: string
}

@Injectable()
export class RequestResetPasswordUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly otpCoreService: OtpCoreService, // Inyectamos el genérico
    private readonly emailEventService: EmailEventService,
    private readonly requestResetPasswordRateLimitPolicy: RequestResetPasswordRateLimitPolicy,
  ) {}

  async execute(email: string): Promise<{ message: string; tokenId?: string }> {
    // Definimos el mensaje estándar (SIEMPRE devolvemos esto)
    const genericResponse = {
      message:
        'Si el email existe, recibirás un código de verificación en tu correo',
      tokenId: undefined,
    }

    // 1. Buscar usuario por email
    const user = await this.usersRepository.findByEmail(email)

    if (!user) {
      // MITIGACIÓN TIMING ATTACK:
      // Si el usuario no existe, esperamos un poco para simular proceso
      // y devolvemos éxito falso.
      await this.simulateDelay()
      return genericResponse
    }

    // 2. RATE LIMIT (SILENT DROP) 🥷
    // Usamos 'canAttempt' (el método booleano que agregamos a la BasePolicy).
    // NO usamos 'checkLimitOrThrow' porque no queremos alertar al atacante con un 429.
    const canAttempt =
      await this.requestResetPasswordRateLimitPolicy.canAttempt(email)

    if (!canAttempt) {
      // SI ESTÁ BLOQUEADO: Retornamos éxito falso.
      // No enviamos email, pero el frontend recibe "200 OK".
      return genericResponse
    }

    // 3. Registrar el intento (Consumir una "ficha")
    // Lo hacemos antes de enviar para prevenir abuso si el email falla.
    await this.requestResetPasswordRateLimitPolicy.registerAttempt(email)

    // 4. Generar sesión OTP (Usando el servicio genérico)
    // Contexto: 'reset-pw' (debe coincidir con el que uses al validar)
    const { tokenId, otpCode } =
      await this.otpCoreService.createSession<ResetPasswordPayload>(
        'reset-pw',
        { userId: user.id }, // Payload seguro (ID en lugar de email)
        3600, // 1 hora de expiración
      )

    // 5. Enviar email con el código OTP (asíncrono, no bloqueante)
    this.emailEventService.emitSendResetPassword({
      to: user.email,
      userName: user.username,
      resetLink: otpCode, // Enviamos el código de 6 dígitos
      expiresInMinutes: 60,
    })

    // 6. Retornar tokenId al frontend
    return {
      message: genericResponse.message,
      tokenId, // El frontend necesita esto para el siguiente paso (Validar OTP)
    }
  }

  /**
   * Simula un retraso de red variable (100ms - 300ms)
   * para evitar enumeración de usuarios por tiempo de respuesta.
   */
  private async simulateDelay(): Promise<void> {
    const min = 100
    const max = 300
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    return new Promise((resolve) => setTimeout(resolve, delay))
  }
}

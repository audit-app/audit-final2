import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { EmailEventService } from '@core/email'
import { TwoFactorTokenService } from '../services/two-factor-token.service'
import { Resend2FARateLimitPolicy } from '../../../core/policies'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'

/**
 * Use Case: Reenviar código 2FA existente
 *
 * Responsabilidades:
 * - Verificar cooldown de 60 segundos (rate limiting)
 * - Obtener sesión 2FA existente usando tokenId
 * - Buscar usuario asociado
 * - Reenviar el MISMO código por email
 * - Marcar intento de resend (iniciar nuevo cooldown)
 *
 * Seguridad implementada:
 * - Cooldown: Espera 60 segundos entre resends
 * - Código expira en 5 minutos (TTL automático de Redis)
 * - One-time use (se elimina después de validar en verify)
 * - NO genera nuevo código, reenvía el existente
 *
 * IMPORTANTE - DIFERENCIA CON ENFOQUE ANTERIOR:
 * - NO genera un nuevo tokenId
 * - NO genera un nuevo código OTP
 * - Reenvía el MISMO código que ya existe en Redis
 * - El usuario debe usar el MISMO tokenId que recibió originalmente
 * - Si el código expiró (5 minutos), el usuario debe hacer login nuevamente
 *
 * Flujo:
 * 1. Obtener sesión 2FA de Redis usando tokenId
 * 2. Si no existe → lanzar excepción (sesión expirada)
 * 3. Extraer userId del payload
 * 4. Verificar cooldown (lanza excepción si debe esperar)
 * 5. Buscar usuario en BD
 * 6. Reenviar el MISMO código por email
 * 7. Marcar intento de resend (cooldown de 60 segundos)
 */
@Injectable()
export class Resend2FACodeUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly twoFactorTokenService: TwoFactorTokenService,
    private readonly emailEventService: EmailEventService,
    private readonly resend2FARateLimitPolicy: Resend2FARateLimitPolicy,
  ) {}

  /**
   * Ejecuta el flujo de reenvío de código 2FA con cooldown
   *
   * @param tokenId - TokenId de 64 caracteres (NO es JWT)
   * @returns Mensaje de confirmación (el tokenId NO cambia)
   * @throws NotFoundException si el usuario no existe o la sesión expiró
   * @throws BadRequestException si la sesión 2FA no existe
   * @throws TooManyAttemptsException si debe esperar cooldown
   */
  async execute(tokenId: string): Promise<{ message: string }> {
    // 1. Obtener sesión 2FA existente de Redis
    const session = await this.twoFactorTokenService.getSession(tokenId)

    if (!session) {
      throw new BadRequestException(
        'Sesión 2FA no encontrada o expirada. Por favor, inicia sesión nuevamente.',
      )
    }

    const { code, payload } = session
    const userId = payload.userId

    // 2. RATE LIMITING: Verificar cooldown (60 segundos)
    // Lanza TooManyAttemptsException si debe esperar
    await this.resend2FARateLimitPolicy.checkCooldownOrThrow(userId)

    // 3. Buscar usuario
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    // 4. Reenviar el MISMO código por email (asíncrono, no bloqueante)
    this.emailEventService.emitSend2FACode({
      to: user.email,
      userName: user.username,
      code,
      expiresInMinutes: 5,
    })

    // 5. Marcar intento de resend (iniciar cooldown de 60 segundos)
    await this.resend2FARateLimitPolicy.markResendAttempt(userId)

    // 6. Retornar mensaje de confirmación
    return {
      message:
        'Código 2FA reenviado. Espera 60 segundos antes de solicitar otro.',
    }
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { EmailService } from '@core/email'
import { TwoFactorTokenService } from '../../services/two-factor-token.service'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'

/**
 * Use Case: Reenviar código 2FA
 *
 * Responsabilidades:
 * - Verificar que el usuario existe
 * - Generar nuevo código
 * - Enviar código por email
 * - Devolver nuevo token
 *
 * Seguridad:
 * - Código expira en 5 minutos (TTL automático)
 * - One-time use (se elimina de Redis después de validar)
 * - Genera nuevo código con nueva expiración
 *
 * NOTA: NO tiene rate limiting porque:
 * - Login ya tiene rate limiting robusto (5 intentos/15min por usuario)
 * - Códigos expiran en 5 minutos (ventana muy corta)
 * - One-time use previene reutilización
 *
 * NOTA: NO revoca códigos anteriores porque:
 * - Redis key estructura (auth:2fa:{token}) no permite buscar por userId eficientemente
 * - TTL de 5 minutos hace que códigos viejos expiren automáticamente
 * - Si el usuario necesita un nuevo código, puede generar otro
 */
@Injectable()
export class Resend2FACodeUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly twoFactorTokenService: TwoFactorTokenService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Ejecuta el flujo de reenvío de código 2FA
   *
   * @param userId - ID del usuario
   * @returns Nuevo token y mensaje de confirmación
   * @throws NotFoundException si el usuario no existe
   */
  async execute(userId: string): Promise<{ token: string; message: string }> {
    // 1. Buscar usuario
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    // 2. Generar nuevo código
    const { code, token } = await this.twoFactorTokenService.generateCode(
      user.id,
    )

    // 3. Enviar código por email
    await this.emailService.sendTwoFactorCode({
      to: user.email,
      userName: user.username,
      code,
      expiresInMinutes: 5,
    })

    return {
      token,
      message: 'Nuevo código 2FA enviado',
    }
  }
}

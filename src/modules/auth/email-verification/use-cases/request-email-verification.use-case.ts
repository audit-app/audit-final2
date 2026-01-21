import { Injectable, Inject } from '@nestjs/common'
import { EmailEventService } from '@core/email'
import { EmailVerificationTokenService } from '../services/email-verification-token.service'
import { USERS_REPOSITORY } from '../../../users/tokens'
import type { IUsersRepository } from '../../../users/repositories'
import { envs } from '@core/config'

/**
 * Use Case: Solicitar verificación de email
 *
 * Responsabilidades:
 * - Buscar usuario por email
 * - Verificar que el email no esté ya verificado
 * - Generar tokenId de verificación (64 caracteres hex)
 * - Enviar email con enlace de verificación
 * - Retornar mensaje de confirmación
 *
 * Seguridad:
 * - TokenId aleatorio de 256 bits (64 chars hex)
 * - Válido por 7 días (TTL en Redis)
 * - One-time use (se elimina de Redis después de verificar)
 * - Throttler global protege el endpoint
 * - No revela si el usuario existe (respuesta genérica)
 *
 * Flujo:
 * 1. Buscar usuario por email
 * 2. Si no existe → retornar mensaje genérico (evitar enumeración)
 * 3. Si email ya verificado → retornar mensaje genérico
 * 4. Generar tokenId con OtpCoreService
 * 5. Enviar email con enlace de verificación
 * 6. Retornar mensaje de confirmación
 */
@Injectable()
export class RequestEmailVerificationUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly emailVerificationTokenService: EmailVerificationTokenService,
    private readonly emailEventService: EmailEventService,
  ) {}

  /**
   * Ejecuta el flujo de solicitud de verificación de email
   *
   * @param email - Email del usuario
   * @returns Mensaje de confirmación (siempre genérico)
   */
  async execute(email: string): Promise<{ message: string }> {
    // Mensaje genérico para evitar enumeración de usuarios
    const genericResponse = {
      message:
        'Si el email existe y no ha sido verificado, recibirás un enlace de verificación.',
    }

    // 1. Buscar usuario por email
    const user = await this.usersRepository.findByEmail(email)

    if (!user) {
      // Usuario no existe → respuesta genérica
      await this.simulateDelay()
      return genericResponse
    }

    // 2. Verificar si el email ya está verificado
    if (user.emailVerified) {
      // Email ya verificado → respuesta genérica
      return genericResponse
    }

    // 3. Generar token JWT de verificación
    const token = await this.emailVerificationTokenService.generateToken(
      user.id,
      user.email,
    )

    // 4. Construir enlace de verificación
    const verificationLink = this.buildVerificationLink(token)

    // 5. Enviar email con enlace de verificación (asíncrono, no bloqueante)
    this.emailEventService.emitSendVerification({
      to: user.email,
      userName: user.username,
      verificationLink,
    })

    // 6. Retornar mensaje genérico
    return genericResponse
  }

  /**
   * Construye el enlace de verificación
   *
   * NOTA: El frontend debe configurar esta URL base
   * Aquí usamos una variable de entorno o un default
   *
   * @param token - TokenId de 64 caracteres hexadecimales
   * @returns Enlace completo de verificación
   */
  private buildVerificationLink(token: string): string {
    const baseUrl = envs.frontend.url
    return `${baseUrl}/auth/verify-email?token=${token}`
  }

  /**
   * Simula un retraso de red variable (100ms - 300ms)
   * para evitar enumeración de usuarios por tiempo de respuesta
   */
  private async simulateDelay(): Promise<void> {
    const min = 100
    const max = 300
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    return new Promise((resolve) => setTimeout(resolve, delay))
  }
}

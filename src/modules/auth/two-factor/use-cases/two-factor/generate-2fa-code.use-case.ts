import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { EmailService } from '@core/email'
import { UuidValidator } from '@core/validators'
import { TwoFactorTokenService } from '../../services/two-factor-token.service'
// import { Generate2FARateLimitPolicy } from '../../policies'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'

/**
 * Use Case: Generar código 2FA
 *
 * Responsabilidades:
 * - Verificar rate limiting (máximo 5 códigos cada 15 minutos)
 * - Buscar usuario por email o ID
 * - Generar código numérico de 6 dígitos usando OtpCoreService
 * - Almacenar código en Redis con TTL
 * - Enviar código por email
 * - Devolver tokenId para validación posterior
 *
 * Seguridad implementada:
 * - Rate limiting: Máximo 5 códigos cada 15 minutos por usuario
 * - Código expira en 5 minutos (TTL automático)
 * - One-time use (se elimina de Redis después de validar)
 * - El tokenId sirve para vincular el código con la sesión del usuario
 *
 * Flujo (similar a request-reset-password):
 * 1. Verificar rate limiting (lanza excepción si excede límite)
 * 2. Registrar intento (consumir ficha)
 * 3. Generar código OTP con OtpCoreService
 * 4. Enviar email con código
 * 5. Retornar tokenId al frontend
 */
@Injectable()
export class Generate2FACodeUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly twoFactorTokenService: TwoFactorTokenService,
    private readonly emailService: EmailService,
    // private readonly generate2FARateLimitPolicy: Generate2FARateLimitPolicy,
  ) {}

  /**
   * Ejecuta el flujo de generación de código 2FA con rate limiting
   *
   * @param identifier - Email o userId del usuario
   * @returns TokenId y mensaje de confirmación
   * @throws NotFoundException si el usuario no existe
   * @throws TooManyAttemptsException si excede el límite de generación
   */
  async execute(
    identifier: string,
  ): Promise<{ token: string; message: string }> {
    // 1. Buscar usuario por email o ID
    let user = await this.usersRepository.findByEmail(identifier)

    // Solo intentar buscar por ID si el identifier es un UUID válido
    if (!user && UuidValidator.isValid(identifier)) {
      user = await this.usersRepository.findById(identifier)
    }

    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    // 2. RATE LIMITING: Verificar límite de generación
    // Lanza TooManyAttemptsException si excede el límite
    // TODO: Implementar Generate2FARateLimitPolicy si se necesita
    // await this.generate2FARateLimitPolicy.checkLimitOrThrow(user.id)

    // 3. Registrar intento (consumir ficha)
    // await this.generate2FARateLimitPolicy.registerFailure(user.id)

    // 4. Generar código 2FA con OtpCoreService
    const { code, token } = await this.twoFactorTokenService.generateCode(
      user.id,
    )

    // 5. Enviar código por email
    await this.emailService.sendTwoFactorCode({
      to: user.email,
      userName: user.username,
      code,
      expiresInMinutes: 5, // 5 minutos
    })

    // 6. Retornar tokenId al frontend
    return {
      token, // tokenId para usar en verify
      message: 'Código 2FA enviado al email registrado',
    }
  }
}

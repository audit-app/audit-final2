import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { LoggerService } from '@core/logger'
import { PasswordHashService, PasswordGeneratorService } from '@core/security'
import { EmailEventService } from '@core/email'
import { TokensService } from '../../../core/services/tokens.service'
import { envs } from '@core/config'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { UserValidator } from '../../../../users/validators/user.validator'
import { ChangeUserEmailDto } from './change-user-email.dto'

/**
 * Use Case: Cambiar email de usuario (solo ADMIN)
 *
 * IMPORTANTE: Este es un cambio CRÍTICO de identidad del usuario
 *
 * Responsabilidades:
 * - Validar que el nuevo email no existe
 * - Generar nueva contraseña temporal aleatoria
 * - Actualizar email, password, resetear firstLoginAt
 * - Revocar TODAS las sesiones activas del usuario
 * - Enviar welcome email con nuevas credenciales al nuevo email
 * - Log detallado de auditoría
 *
 * Flujo:
 * 1. Admin detecta error en email o usuario solicita cambio
 * 2. Admin hace POST /users/:id/change-email con nuevo email
 * 3. Sistema valida que nuevo email no existe
 * 4. Genera nueva contraseña temporal (12 caracteres)
 * 5. Actualiza usuario: email, password, isTemporaryPassword=true, firstLoginAt=null
 * 6. Revoca TODAS las sesiones activas (fuerza re-login)
 * 7. Envía welcome email con credenciales al NUEVO email
 * 8. Registra cambio en logs de auditoría
 *
 * Seguridad:
 * - Solo ADMIN puede ejecutar este endpoint
 * - Genera nueva password temporal (el usuario debe cambiarla)
 * - Revoca todas las sesiones (previene acceso no autorizado)
 * - Log de auditoría detallado (quién cambió qué)
 */
@Injectable()
export class ChangeUserEmailUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly userValidator: UserValidator,
    private readonly passwordHashService: PasswordHashService,
    private readonly passwordGeneratorService: PasswordGeneratorService,
    private readonly tokensService: TokensService,
    private readonly emailEventService: EmailEventService,
    private readonly logger: LoggerService,
  ) {}

  @Transactional()
  async execute(
    userId: string,
    dto: ChangeUserEmailDto,
  ): Promise<{ message: string }> {
    // 1. Buscar usuario actual
    const user = await this.usersRepository.findById(userId)
    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    const oldEmail = user.email

    // 2. Validar que el nuevo email no existe
    await this.userValidator.validateUniqueEmail(dto.newEmail, userId)

    // 3. Generar nueva contraseña temporal aleatoria (12 caracteres)
    const temporaryPassword = this.passwordGeneratorService.generate(12)
    const hashedPassword =
      await this.passwordHashService.hash(temporaryPassword)

    // 4. Actualizar usuario
    user.email = dto.newEmail
    user.password = hashedPassword
    user.isTemporaryPassword = true
    user.firstLoginAt = null // Resetear porque es como un "nuevo" usuario

    await this.usersRepository.save(user)

    // 5. Revocar TODAS las sesiones activas (fuerza re-login en todos los dispositivos)
    await this.tokensService.revokeAllUserTokens(userId)

    // 6. Enviar welcome email con nuevas credenciales al NUEVO email
    this.emailEventService.emitSendWelcome({
      to: dto.newEmail,
      userName: user.username,
      userEmail: dto.newEmail,
      temporaryPassword, // Password sin hashear
      loginLink: envs.app.url + '/login',
    })

    // 7. Log de auditoría (CRÍTICO para trazabilidad)
    this.logger.log(
      `ADMIN cambió email de usuario ${userId} (${user.username}): ${oldEmail} → ${dto.newEmail}. ` +
        `Nueva contraseña temporal generada. Sesiones revocadas.`,
      'ChangeUserEmailUseCase',
    )

    return {
      message: `Email cambiado exitosamente. Se envió un email de bienvenida con las nuevas credenciales a ${dto.newEmail}.`,
    }
  }
}

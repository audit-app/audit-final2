import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import { Transactional } from '@core/database'
import { PasswordHashService } from '@core/security'
import { UserEntity } from '../../entities/user.entity'
import { USERS_REPOSITORY } from '../../tokens'
import type { IUsersRepository } from '../../repositories'
import { EmailVerificationService } from '../../services'
import { UserVerifyEmailDto } from './verify-email.dto'

/**
 * Caso de uso: Verificar email de usuario y establecer contraseña inicial
 *
 * Responsabilidades:
 * - Validar token de verificación
 * - Establecer contraseña inicial del usuario (actualmente null)
 * - Marcar email como verificado
 * - Activar usuario (cambiar status a ACTIVE)
 *
 * Flujo:
 * 1. Usuario recibe email de invitación con link: /verify-email?token=<tokenId>
 * 2. Frontend muestra formulario donde el usuario ingresa su contraseña
 * 3. Frontend hace POST /users/verify-email con {token, password}
 * 4. Validamos token, hasheamos password, marcamos verificado y activamos
 *
 * IMPORTANTE: El token se revoca automáticamente al consumirlo (one-time use)
 */
@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordHashService: PasswordHashService,
  ) {}

  /**
   * Verifica el email de un usuario y establece su contraseña inicial
   *
   * @param dto - Token y contraseña inicial
   * @returns Usuario verificado, con contraseña y activado
   * @throws {BadRequestException} Si el token es inválido, expiró o el email ya fue verificado
   */
  @Transactional()
  async execute(dto: UserVerifyEmailDto): Promise<UserEntity> {
    // 1. Consumir token (busca, valida y revoca automáticamente)
    const tokenData = await this.emailVerificationService.consumeToken(
      dto.token,
    )

    if (!tokenData) {
      throw new BadRequestException(
        'Token de verificación inválido o expirado. Por favor, contacte al administrador para que le reenvíe la invitación.',
      )
    }

    const { userId } = tokenData

    // 2. Buscar usuario
    const user = await this.usersRepository.findById(userId)
    if (!user) {
      throw new BadRequestException('Usuario no encontrado')
    }

    // 3. Verificar si ya está verificado (evitar doble procesamiento)
    if (user.emailVerified) {
      throw new BadRequestException(
        'El email ya fue verificado anteriormente. Si olvidó su contraseña, use la opción de recuperación.',
      )
    }

    // 4. NUEVO: Hashear y establecer la contraseña inicial
    user.password = await this.passwordHashService.hash(dto.password)

    // 5. Marcar como verificado y activar
    user.emailVerified = true
    user.emailVerifiedAt = new Date()

    // 6. Guardar cambios
    return await this.usersRepository.save(user)
  }
}

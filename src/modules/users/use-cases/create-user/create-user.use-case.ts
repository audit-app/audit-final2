import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { LoggerService } from '@core/logger'
import { PasswordHashService } from '@core/security'
import { EmailEventService } from '@core/email'
import { envs } from '@core/config'
import * as crypto from 'crypto'
import { CreateUserDto } from './create-user.dto'
import { UserEntity } from '../../entities/user.entity'
import { UserValidator } from '../../validators/user.validator'
import { UserFactory } from '../../factories/user.factory'
import { USERS_REPOSITORY } from '../../tokens'
import type { IUsersRepository } from '../../repositories'
import { ORGANIZATION_REPOSITORY } from '../../../organizations/tokens'
import type { IOrganizationRepository } from '../../../organizations/repositories'
import { OrganizationNotFoundException } from '../../../organizations/exceptions/organization-not-found.exception'

/**
 * Use Case: Crear usuario con contraseña temporal
 *
 * Responsabilidades:
 * - Validar datos únicos (email, username, CI)
 * - Generar contraseña temporal aleatoria (12 caracteres)
 * - Crear usuario con password hasheado e isTemporaryPassword=true
 * - Enviar welcome email con credenciales (email + password temporal)
 *
 * Flujo:
 * 1. Admin crea usuario en el sistema
 * 2. Sistema genera contraseña temporal aleatoria
 * 3. Hashea la contraseña y guarda el usuario
 * 4. Envía welcome email con: email + contraseña temporal
 * 5. Usuario recibe email y puede hacer login
 * 6. En primer login, debe cambiar la contraseña temporal
 *
 * IMPORTANTE:
 * - La contraseña temporal es ALEATORIA (no basada en datos del usuario)
 * - El usuario DEBE cambiar la contraseña en primer login
 * - Recibir el email con credenciales ES la verificación implícita
 */
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    private readonly validator: UserValidator,
    private readonly userFactory: UserFactory,
    private readonly passwordHashService: PasswordHashService,
    private readonly emailEventService: EmailEventService,
    private readonly logger: LoggerService,
  ) {}

  @Transactional()
  async execute(dto: CreateUserDto): Promise<UserEntity> {
    this.validator.validateRoles(dto.roles)
    await this.validator.validateUniqueConstraints(
      dto.email,
      dto.username,
      dto.ci,
    )

    const organization = await this.organizationRepository.findById(
      dto.organizationId,
    )

    if (!organization) {
      throw new OrganizationNotFoundException(dto.organizationId)
    }

    // 1. Generar contraseña temporal aleatoria (12 caracteres)
    const temporaryPassword = this.generateRandomPassword(12)

    // 2. Hashear la contraseña
    const hashedPassword =
      await this.passwordHashService.hash(temporaryPassword)

    // 3. Crear usuario con contraseña temporal
    const user = this.userFactory.createFromDto(dto)
    user.password = hashedPassword
    user.isTemporaryPassword = true
    // provider se determina automáticamente: providerId = null → 'local'

    const savedUser = await this.usersRepository.save(user)

    // 4. Enviar welcome email con credenciales (asíncrono, no bloqueante)
    try {
      this.emailEventService.emitSendWelcome({
        to: savedUser.email,
        userName: savedUser.username,
        userEmail: savedUser.email,
        temporaryPassword, // Password sin hashear
        loginLink: envs.app.url + '/login',
      })

      this.logger.log(
        `Usuario creado: ${savedUser.email} (userId: ${savedUser.id}). Welcome email enviado con credenciales.`,
      )
    } catch (error) {
      this.logger.error(
        `Error al enviar welcome email a ${savedUser.email}:`,
        error instanceof Error ? error.stack : String(error),
      )
      // No lanzar error, el usuario fue creado exitosamente
    }

    return savedUser
  }

  /**
   * Genera una contraseña aleatoria segura
   *
   * Requisitos:
   * - 12 caracteres
   * - Incluye mayúsculas, minúsculas, números y símbolos
   * - Generada con crypto.randomBytes (criptográficamente segura)
   *
   * @param length - Longitud de la contraseña (default: 12)
   * @returns Contraseña aleatoria
   */
  private generateRandomPassword(length: number = 12): string {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'
    const randomBytes = crypto.randomBytes(length)

    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length]
    }

    return password
  }
}

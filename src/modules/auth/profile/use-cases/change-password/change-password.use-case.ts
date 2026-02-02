import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { Transactional } from '@core/database'
import { PasswordHashService } from '@core/security'
import { TrustedDeviceRepository } from '../../../session/devices'
import { TokensService } from '../../../core/services/tokens.service'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { ChangePasswordDto } from './change-password.dto'

/**
 * Use Case: Usuario cambia SU propia contraseña
 *
 * Diferencia con ResetPasswordUseCase:
 * - Este requiere la contraseña ACTUAL (validación de identidad)
 * - NO usa token OTP
 * - Para usuarios autenticados que CONOCEN su contraseña
 *
 * Seguridad:
 * - Revoca TODAS las sesiones activas (excepto la actual)
 * - Revoca TODOS los dispositivos confiables
 * - Usuario debe volver a hacer 2FA en todos los dispositivos
 *
 * Endpoint: PATCH /auth/profile/password
 */
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly trustedDeviceRepository: TrustedDeviceRepository,
    private readonly tokensService: TokensService,
  ) {}

  @Transactional()
  async execute(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // 1. Buscar usuario
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    // Verificar que el usuario tenga contraseña (usuarios OAuth podrían no tenerla)
    if (!user.password) {
      throw new BadRequestException(
        'Este usuario no tiene contraseña configurada. Usa el método de autenticación apropiado.',
      )
    }

    // 2. Validar contraseña actual
    const isValidPassword = await this.passwordHashService.verify(
      dto.currentPassword,
      user.password,
    )

    if (!isValidPassword) {
      throw new BadRequestException('La contraseña actual es incorrecta')
    }

    // 3. Validar que la nueva contraseña sea diferente
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual',
      )
    }

    // 4. Hashear nueva contraseña
    const hashedPassword = await this.passwordHashService.hash(dto.newPassword)

    // 5. Actualizar contraseña y marcar como NO temporal
    user.password = hashedPassword
    user.isTemporaryPassword = false
    await this.usersRepository.save(user)

    // 6. PROTOCOLO "TIERRA QUEMADA" (Seguridad Máxima)

    // A. Revocar TODOS los dispositivos confiables
    // Obliga a usar 2FA la próxima vez en cualquier dispositivo.
    await this.trustedDeviceRepository.deleteAllForUser(userId)

    // B. Revocar TODAS las sesiones activas (Refresh Tokens)
    // Expulsa al usuario de todos los navegadores/apps (excepto la actual).
    // El token actual seguirá funcionando hasta que expire (por JWT).
    await this.tokensService.revokeAllUserTokens(userId)

    return {
      message:
        'Contraseña actualizada exitosamente. Se han cerrado todas las sesiones por seguridad. Deberás volver a iniciar sesión.',
    }
  }
}

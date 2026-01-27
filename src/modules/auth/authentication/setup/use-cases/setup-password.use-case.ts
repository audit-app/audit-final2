import { Injectable, BadRequestException, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { CacheService } from '@core/cache'
import { PasswordHashService } from '@core/security'
import { LoggerService } from '@core/logger'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { SetupPasswordDto } from '../dtos/setup-password.dto'

/**
 * Use Case: Establecer contraseña inicial después de verificar email
 *
 * Responsabilidades:
 * - Validar token temporal de setup (15 minutos de vigencia)
 * - Establecer contraseña inicial del usuario
 * - Revocar token de setup (one-time use)
 *
 * Flujo:
 * 1. Usuario verifica email → recibe setupToken temporal
 * 2. Usuario elige "Establecer Contraseña" en frontend
 * 3. Frontend hace POST /auth/setup/password con {setupToken, password}
 * 4. Validamos token, hasheamos password, guardamos
 * 5. Revocamos token (one-time use)
 * 6. Usuario puede hacer login con password
 *
 * Seguridad:
 * - Token temporal expira en 15 minutos (TTL automático en Redis)
 * - One-time use (se elimina después de usarlo)
 * - Requiere que el email ya esté verificado
 * - Password hasheado con bcrypt
 */
@Injectable()
export class SetupPasswordUseCase {
  private readonly SETUP_TOKEN_PREFIX = 'auth:setup-credentials:'

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly cacheService: CacheService,
    private readonly passwordHashService: PasswordHashService,
    private readonly logger: LoggerService,
  ) {}

  @Transactional()
  async execute(dto: SetupPasswordDto): Promise<{ message: string }> {
    // 1. Validar token temporal
    const setupKey = `${this.SETUP_TOKEN_PREFIX}${dto.setupToken}`
    const tokenData = await this.cacheService.getJSON<{
      userId: string
      email: string
    }>(setupKey)

    if (!tokenData) {
      throw new BadRequestException(
        'Token de configuración inválido o expirado. Por favor, verifica tu email nuevamente.',
      )
    }

    // 2. Buscar usuario
    const user = await this.usersRepository.findById(tokenData.userId)
    if (!user) {
      throw new BadRequestException('Usuario no encontrado')
    }

    // 3. Validar que el email esté verificado
    if (!user.emailVerified) {
      throw new BadRequestException(
        'Debes verificar tu email antes de establecer una contraseña',
      )
    }

    // 4. Validar que el email coincida (prevenir token replay)
    if (user.email !== tokenData.email) {
      throw new BadRequestException(
        'El token no corresponde a este usuario. Intenta verificar tu email nuevamente.',
      )
    }

    // 5. Establecer contraseña (hashear automáticamente)
    user.password = await this.passwordHashService.hash(dto.password)
    await this.usersRepository.save(user)

    // 6. Revocar token de setup (one-time use)
    await this.cacheService.del(setupKey)

    this.logger.log(
      `Contraseña establecida para usuario ${user.email} (userId: ${user.id})`,
      'SetupPasswordUseCase',
    )

    return {
      message:
        'Contraseña establecida exitosamente. Ahora puedes iniciar sesión.',
    }
  }
}

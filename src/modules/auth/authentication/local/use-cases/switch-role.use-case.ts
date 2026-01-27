import { Injectable, Inject } from '@nestjs/common'
import { LoggerService } from '@core'
import { TokensService } from '../../../core/services'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { SwitchRoleDto, SwitchRoleResponseDto } from '../dtos'
import { UserNotFoundException } from '../../../../users/exceptions'

/**
 * Use Case: Cambiar rol activo del usuario
 *
 * Responsabilidades:
 * - Validar que el usuario existe
 * - Validar que el usuario tiene el rol solicitado
 * - Generar un nuevo access token con el nuevo rol activo
 * - Devolver el token y la información del rol
 *
 * El refresh token NO cambia, solo se genera un nuevo access token
 */
@Injectable()
export class SwitchRoleUseCase {
  constructor(
    private readonly tokensService: TokensService,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Ejecuta el cambio de rol
   *
   * @param userId - ID del usuario autenticado
   * @param dto - Datos del cambio de rol (newRole)
   * @returns Nuevo access token con el rol cambiado
   */
  async execute(
    userId: string,
    dto: SwitchRoleDto,
  ): Promise<SwitchRoleResponseDto> {
    const { newRole } = dto

    // 1. Buscar usuario y validar existencia
    const user = await this.usersRepository.findById(userId)
    if (!user) {
      throw new UserNotFoundException(userId, 'ID')
    }

    // 2. Actualizar currentRole en TODAS las sesiones activas del usuario en Redis
    // Esto asegura que el cambio de rol persista en futuros refreshes
    await this.tokensService.updateCurrentRoleInAllSessions(userId, newRole)

    // 3. Generar nuevo access token con el rol solicitado
    // Este método internamente valida que el usuario tenga el rol
    const accessToken = await this.tokensService.generateAccessTokenWithRole(
      user,
      newRole,
    )

    this.logger.log(
      `Usuario ${user.username} (${userId}) cambió de rol a: ${newRole}`,
      'SwitchRoleUseCase',
    )

    // 4. Devolver respuesta
    return {
      accessToken,
      currentRole: newRole,
      availableRoles: user.roles,
    }
  }
}

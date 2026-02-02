import { Injectable, Inject } from '@nestjs/common'
import { ConnectionMetadata, LoggerService } from '@core'
import { TokensService } from '../../../core/services'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { SwitchRoleDto } from '../dtos'
import { InvalidTokenException } from 'src/modules/auth/core'

@Injectable()
export class SwitchRoleUseCase {
  constructor(
    private readonly tokensService: TokensService,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    currentAccessToken: string,
    dto: SwitchRoleDto,
    refreshToken: string,
    connection: ConnectionMetadata,
  ): Promise<{
    accessToken: string
    refreshToken: string
    rememberMe: boolean
  }> {
    const { newRole } = dto

    // 1. Validar el Refresh Token y obtener la sesión de Redis
    const payload = this.tokensService.verifyRefreshToken(refreshToken)
    const storedSession = await this.tokensService.getStoredSession(
      payload.sub,
      payload.tokenId,
    )

    // Detección de Replay Attack / Revocación
    if (!storedSession) {
      this.logger.warn(
        `Intento de switch-role con sesión inexistente. User: ${payload.sub}`,
        'SwitchRoleUseCase.SecurityAlert',
      )
      throw new InvalidTokenException('Sesión inválida o expirada')
    }

    // 2. Buscar usuario y validar permisos para el nuevo rol
    const user = await this.usersRepository.findById(payload.sub)
    if (!user || !user.isActive) {
      throw new InvalidTokenException('Usuario no válido o inactivo')
    }

    if (!user.roles.includes(newRole)) {
      throw new InvalidTokenException('No tienes permiso para asumir este rol')
    }

    // 3. EJECUTAR ROTACIÓN ATÓMICA
    const { accessToken, refreshToken: newRefreshToken } =
      await this.tokensService.rotateSession(
        user,
        payload.tokenId,
        connection,
        storedSession.rememberMe,
        newRole,
        currentAccessToken,
      )

    this.logger.log(
      `Cambio de rol exitoso: ${user.username} -> ${newRole}`,
      'SwitchRoleUseCase',
    )

    return {
      accessToken,
      refreshToken: newRefreshToken,
      rememberMe: storedSession.rememberMe,
    }
  }
}

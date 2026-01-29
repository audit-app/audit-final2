import { Injectable, Inject } from '@nestjs/common'
import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
import { InvalidTokenException } from '../../../core/exceptions'
import type { ConnectionMetadata } from '@core/http'
import { LoggerService } from '@core/logger'
import { TokensService } from '../../../core/services'

/**
 * Use Case: Renovar tokens (Token Rotation)
 *
 * Responsabilidades:
 * - Validar refresh token (delegado a TokensService)
 * - Verificar que no haya sido revocado (Redis)
 * - ROTATION: Revocar el token viejo
 * - Generar nuevo par de tokens
 *
 * Implementa token rotation para máxima seguridad
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly tokensService: TokensService,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    oldRefreshToken: string,
    connection: ConnectionMetadata,
  ): Promise<{
    accessToken: string
    refreshToken: string
    rememberMe: boolean
  }> {
    // 1. ✅ Verificar y decodificar (CENTRALIZADO en TokensService)
    // El manejo de errores JWT y logs está dentro del servicio
    const payload = this.tokensService.verifyRefreshToken(oldRefreshToken)

    // 2. Verificar existencia en Redis (Revocación / Reuso)
    const storedSession = await this.tokensService.getStoredSession(
      payload.sub,
      payload.tokenId,
    )

    if (!storedSession) {
      // ⚠️ Alerta de Seguridad: Token válido pero revocado
      // El token tiene firma válida pero ya no existe (ya fue usado).
      // Alguien está intentando reusar un token viejo (Replay Attack).
      this.logger.warn(
        `⚠️ Intento de reuso de token. User: ${payload.sub} | Posible robo de sesión`,
        'RefreshTokenUseCase.SecurityAlert',
      )

      throw new InvalidTokenException(
        'Refresh token revocado o ya ha sido usado',
      )
    }

    // 3. Buscar usuario y verificar estado
    const user = await this.usersRepository.findById(payload.sub)
    if (!user || !user.isActive) {
      throw new InvalidTokenException('Usuario no encontrado o suspendido')
    }

    // 4. ROTATION: Revocar el refresh token viejo
    await this.tokensService.revokeRefreshToken(payload.sub, payload.tokenId)
    const rememberMe = storedSession.rememberMe ?? false

    // 5. Generar nuevo par de tokens preservando el rol activo de la sesión
    const { accessToken, refreshToken } =
      await this.tokensService.generateTokenPair(
        user,
        connection,
        rememberMe,
        storedSession.currentRole, // ← Preservar el rol activo
      )

    return { accessToken, refreshToken, rememberMe }
  }
}

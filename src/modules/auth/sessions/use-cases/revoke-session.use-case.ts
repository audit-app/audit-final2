import { Injectable, NotFoundException } from '@nestjs/common'
import { TokensService } from '../../login/services/tokens.service'
import { TokenStorageRepository } from '../../login/services/token-storage.repository'

/**
 * Use Case: Revocar una sesión específica
 *
 * Responsabilidades:
 * - Validar que la sesión existe y pertenece al usuario
 * - Revocar el refresh token (eliminarlo de Redis)
 * - Prevenir que la sesión pueda usarse nuevamente
 *
 * Seguridad:
 * - Solo el propietario puede revocar sus propias sesiones
 * - Validación de pertenencia antes de eliminar
 * - No se puede revocar una sesión inexistente
 */
@Injectable()
export class RevokeSessionUseCase {
  constructor(
    private readonly tokensService: TokensService,
    private readonly tokenStorage: TokenStorageRepository,
  ) {}

  /**
   * Ejecuta la revocación de una sesión
   *
   * @param userId - ID del usuario autenticado
   * @param sessionId - ID de la sesión (tokenId) a revocar
   * @returns Mensaje de confirmación
   * @throws NotFoundException si la sesión no existe o no pertenece al usuario
   */
  async execute(
    userId: string,
    sessionId: string,
  ): Promise<{ message: string }> {
    // 1. Validar que la sesión existe y pertenece al usuario
    const isValid = await this.tokenStorage.validate(userId, sessionId)

    if (!isValid) {
      throw new NotFoundException(
        'Sesión no encontrada o ya fue revocada',
      )
    }

    // 2. Revocar la sesión (eliminar de Redis)
    await this.tokensService.revokeRefreshToken(userId, sessionId)

    return {
      message: 'Sesión revocada exitosamente',
    }
  }
}

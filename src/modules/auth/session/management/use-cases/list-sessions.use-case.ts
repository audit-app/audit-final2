import { Injectable } from '@nestjs/common'
import { TokenStorageRepository } from '../../../core/services/token-storage.repository'
import { SessionResponseDto } from '../dtos'

/**
 * Use Case: Listar sesiones activas del usuario
 *
 * Responsabilidades:
 * - Obtener todas las sesiones activas (refresh tokens) del usuario
 * - Identificar cuál es la sesión actual (comparando tokenId)
 * - Formatear metadata para el frontend (browser, OS, device)
 *
 * Casos de uso:
 * - Ver en qué dispositivos tienes sesión activa
 * - Cerrar sesiones de dispositivos que no reconoces
 */
@Injectable()
export class ListSessionsUseCase {
  constructor(private readonly tokenStorage: TokenStorageRepository) {}

  /**
   * Ejecuta el listado de sesiones activas
   *
   * @param userId - ID del usuario autenticado
   * @param currentTokenId - ID del token actual (para marcarlo como "current")
   * @returns Array de sesiones con metadata
   */
  async execute(
    userId: string,
    currentTokenId?: string,
  ): Promise<SessionResponseDto[]> {
    // 1. Obtener todas las sesiones del usuario desde Redis
    const sessions = await this.tokenStorage.findAllByUser(userId)

    // 2. Mapear a DTO y marcar la sesión actual
    return sessions.map((session) => ({
      sessionId: session.tokenId,
      ip: session.ip,
      browser: session.browser,
      os: session.os,
      device: session.device,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      isCurrent: session.tokenId === currentTokenId, // Marcar la sesión actual
    }))
  }
}

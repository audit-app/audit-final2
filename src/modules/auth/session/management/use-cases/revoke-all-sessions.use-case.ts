import { Injectable } from '@nestjs/common'
import { TokensService } from '../../../core/services/tokens.service'

/**
 * Use Case: Revocar todas las sesiones del usuario (excepto la actual)
 *
 * Responsabilidades:
 * - Cerrar todas las sesiones activas del usuario
 * - Forzar re-login en todos los dispositivos (excepto el actual)
 * - Útil cuando sospechas que tu cuenta fue comprometida
 *
 * Casos de uso:
 * - Botón "Cerrar sesión en todos los dispositivos"
 * - Seguridad: detectaste actividad sospechosa
 * - Cambio de contraseña (opcional: cerrar todas)
 *
 * NOTA: La sesión actual NO se cierra (el usuario sigue logueado)
 */
@Injectable()
export class RevokeAllSessionsUseCase {
  constructor(private readonly tokensService: TokensService) {}

  /**
   * Ejecuta la revocación de todas las sesiones
   *
   * @param userId - ID del usuario autenticado
   * @returns Mensaje de confirmación con cantidad de sesiones cerradas
   */
  async execute(userId: string): Promise<{ message: string; count: number }> {
    // Revocar TODAS las sesiones del usuario (incluyendo la actual)
    // El frontend debe manejar el re-login si es necesario
    await this.tokensService.revokeAllUserTokens(userId)

    return {
      message:
        'Todas las sesiones han sido cerradas. Deberás iniciar sesión nuevamente en todos tus dispositivos.',
      count: 0, // No podemos saber el count exacto porque revokeAllUserTokens no lo retorna
    }
  }
}

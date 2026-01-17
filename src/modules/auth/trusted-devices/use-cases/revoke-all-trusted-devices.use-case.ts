import { Injectable } from '@nestjs/common'
import { TrustedDeviceRepository } from '../repositories/trusted-device.repository'

/**
 * Use Case: Revocar todos los dispositivos confiables del usuario
 *
 * Responsabilidades:
 * - Eliminar todos los dispositivos confiables del usuario (Redis)
 * - Forzar 2FA en el próximo login desde cualquier dispositivo
 * - Útil cuando sospechas que tu cuenta fue comprometida
 *
 * Casos de uso:
 * - Botón "Revocar todos los dispositivos confiables"
 * - Seguridad: detectaste actividad sospechosa
 * - Cambio de contraseña (opcional: revocar todos los dispositivos)
 *
 * NOTA: También revoca el dispositivo actual (el usuario deberá hacer 2FA de nuevo)
 */
@Injectable()
export class RevokeAllTrustedDevicesUseCase {
  constructor(
    private readonly trustedDeviceRepository: TrustedDeviceRepository,
  ) {}

  /**
   * Ejecuta la revocación de todos los dispositivos confiables
   *
   * @param userId - ID del usuario autenticado
   * @returns Mensaje de confirmación con cantidad de dispositivos revocados
   */
  async execute(userId: string): Promise<{ message: string; count: number }> {
    // Revocar TODOS los dispositivos confiables del usuario
    const count = await this.trustedDeviceRepository.deleteAllForUser(userId)

    return {
      message:
        'Todos los dispositivos confiables han sido revocados. Se solicitará 2FA en el próximo login.',
      count,
    }
  }
}

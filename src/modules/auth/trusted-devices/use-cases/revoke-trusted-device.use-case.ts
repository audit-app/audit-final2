import { Injectable, NotFoundException } from '@nestjs/common'
import { TrustedDeviceRepository } from '../repositories/trusted-device.repository'

/**
 * Use Case: Revocar un dispositivo confiable específico
 *
 * Responsabilidades:
 * - Validar que el dispositivo existe y pertenece al usuario
 * - Eliminar el dispositivo de la lista de confiables (Redis)
 * - Forzar 2FA en el próximo login desde ese dispositivo
 *
 * Seguridad:
 * - Solo el propietario puede revocar sus propios dispositivos
 * - Validación de pertenencia antes de eliminar
 * - No se puede revocar un dispositivo inexistente
 */
@Injectable()
export class RevokeTrustedDeviceUseCase {
  constructor(
    private readonly trustedDeviceRepository: TrustedDeviceRepository,
  ) {}

  /**
   * Ejecuta la revocación de un dispositivo confiable
   *
   * @param userId - ID del usuario autenticado
   * @param deviceId - UUID del dispositivo (NO el fingerprint)
   */
  async execute(
    userId: string,
    deviceId: string, // <--- CAMBIO: Recibimos el UUID
  ): Promise<{ message: string }> {
    // OPTIMIZACIÓN:
    // En lugar de preguntar "existe?" y luego "borrar" (2 llamadas a Redis),
    // intentamos borrar directamente. El repositorio abstracto devuelve true/false.
    const wasDeleted = await this.trustedDeviceRepository.delete(
      userId,
      deviceId,
    )

    if (!wasDeleted) {
      throw new NotFoundException('Dispositivo no encontrado o ya fue revocado')
    }

    return {
      message:
        'Dispositivo confiable revocado exitosamente. Se solicitará 2FA en el próximo login desde este dispositivo.',
    }
  }
}

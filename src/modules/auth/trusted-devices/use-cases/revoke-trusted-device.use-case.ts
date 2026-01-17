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
   * @param fingerprint - Fingerprint del dispositivo a revocar
   * @returns Mensaje de confirmación
   * @throws NotFoundException si el dispositivo no existe o no pertenece al usuario
   */
  async execute(
    userId: string,
    fingerprint: string,
  ): Promise<{ message: string }> {
    // 1. Validar que el dispositivo existe y pertenece al usuario
    const isTrusted = await this.trustedDeviceRepository.isTrusted(
      userId,
      fingerprint,
    )

    if (!isTrusted) {
      throw new NotFoundException(
        'Dispositivo no encontrado o ya fue revocado',
      )
    }

    // 2. Revocar el dispositivo (eliminar de Redis)
    await this.trustedDeviceRepository.delete(userId, fingerprint)

    return {
      message:
        'Dispositivo confiable revocado exitosamente. Se solicitará 2FA en el próximo login desde este dispositivo.',
    }
  }
}

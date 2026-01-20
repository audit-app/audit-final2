import { Injectable } from '@nestjs/common'
import { TrustedDeviceRepository } from '../repositories/trusted-device.repository'
import { TrustedDeviceResponseDto } from '../dtos'

/**
 * Use Case: Listar dispositivos confiables del usuario
 *
 * Responsabilidades:
 * - Obtener todos los dispositivos confiables del usuario desde Redis
 * - Formatear metadata para el frontend (browser, OS, device)
 * - Ordenar por último uso (más reciente primero)
 *
 * Casos de uso:
 * - Ver qué dispositivos tienen "Remember this device" activado
 * - Revocar dispositivos que no reconoces
 * - Auditar accesos confiables
 */
@Injectable()
export class ListTrustedDevicesUseCase {
  constructor(
    private readonly trustedDeviceRepository: TrustedDeviceRepository,
  ) {}

  /**
   * Ejecuta el listado de dispositivos confiables
   *
   * @param userId - ID del usuario autenticado
   * @returns Array de dispositivos confiables con metadata
   */
  async execute(userId: string): Promise<TrustedDeviceResponseDto[]> {
    // 1. Obtener todos los dispositivos confiables del usuario desde Redis
    const devices = await this.trustedDeviceRepository.findAllByUser(userId)

    // 2. Mapear a DTO (ya vienen con la estructura correcta)
    return devices.map((device) => ({
      fingerprint: device.fingerprint,
      browser: device.browser,
      os: device.os,
      device: device.device,
      id: device.id,
      ip: device.ip,
      createdAt: device.createdAt,
      lastUsedAt: device.lastUsedAt,
    }))
  }
}

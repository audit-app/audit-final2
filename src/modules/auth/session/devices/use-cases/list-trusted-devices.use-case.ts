import { Injectable } from '@nestjs/common'
import { TrustedDeviceRepository } from '../repositories/trusted-device.repository'
import { TrustedDeviceResponseDto } from '../dtos'
import { PaginatedResponse, PaginatedResponseBuilder } from '@core'

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
  async execute(
    userId: string,
  ): Promise<PaginatedResponse<TrustedDeviceResponseDto>> {
    const devices = await this.trustedDeviceRepository.findAllByUser(userId)

    const data = devices.map((device) => ({
      fingerprint: device.fingerprint,
      browser: device.browser,
      os: device.os,
      device: device.device,
      id: device.id,
      ip: device.ip,
      createdAt: device.createdAt,
      lastUsedAt: device.lastUsedAt,
    }))

    return PaginatedResponseBuilder.createAll(data)
  }
}

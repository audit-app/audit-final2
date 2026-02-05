import { Injectable } from '@nestjs/common'
import { AbstractUserSetRepository, CacheService } from '@core/cache'
import { v4 as uuidv4 } from 'uuid'
import { envs } from '@core/config'

/**
 * Metadata descriptiva (Lo que viene del User Agent / Frontend)
 */
export interface TrustedDeviceMetadata {
  name?: string
  browser: string
  os: string
  device: string
  ip: string
  fingerprint: string
}

/**
 * Entidad completa almacenada (Lo que guardas en Redis)
 */
export interface StoredTrustedDevice extends TrustedDeviceMetadata {
  id: string // El UUID aleatorio (Token de confianza)
  userId: string
  createdAt: number
  lastUsedAt: number
}

@Injectable()
export class TrustedDeviceRepository extends AbstractUserSetRepository<StoredTrustedDevice> {
  constructor(cacheService: CacheService) {
    super(cacheService, {
      basePrefix: 'auth:trusted-device',
      maxItemsPerUser: 10,
      ttlSeconds: envs.twoFactor.trustedDeviceExpires.seconds,
    })
  }

  // ==========================================
  // 1. IMPLEMENTACIÓN ABSTRACTA
  // ==========================================

  protected getItemId(item: StoredTrustedDevice): string {
    return item.id
  }

  protected getLastActive(item: StoredTrustedDevice): number {
    return item.lastUsedAt
  }

  // ==========================================
  // 2. MÉTODOS PÚBLICOS
  // ==========================================

  /**
   * Genera y guarda un nuevo dispositivo confiable.
   * Retorna el UUID que se envia al frontend (en una cookie).
   */
  async saveDevice(
    userId: string,
    metadata: TrustedDeviceMetadata,
  ): Promise<string> {
    const deviceId = uuidv4()

    const device: StoredTrustedDevice = {
      ...metadata,
      id: deviceId,
      userId,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    }

    await this.save(userId, device)

    return deviceId
  }

  /**
   * Valida usando el ID aleatorio (que viene de la cookie).
   */
  async validateDevice(
    userId: string,
    deviceId: string,
    currentFingerprint?: string,
  ): Promise<boolean> {
    // 1. Verificación básica (Existencia y TTL)
    const device = await this.findOne(userId, deviceId)
    if (!device) return false

    // 2. Actualizar último uso (Heartbeat)
    await this.updateLastUsed(userId, device)

    // 3. (Opcional) Validación estricta de fingerprint
    // Si el fingerprint cambió drásticamente, podríamos desconfiar,
    if (currentFingerprint && device.fingerprint !== currentFingerprint) {
      // en caso de seguridad extrema
    }

    return true
  }

  /**
   * Helper privado para actualizar fecha
   */
  private async updateLastUsed(
    userId: string,
    device: StoredTrustedDevice,
  ): Promise<void> {
    device.lastUsedAt = Date.now()
    await this.save(userId, device)
  }
}

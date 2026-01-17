import { Injectable } from '@nestjs/common'
import { CacheService } from '@core/cache'
import { TimeUtil } from '@core/utils'
import { TRUSTED_DEVICE_CONFIG } from '../config/trusted-device.config'

/**
 * Metadata de un dispositivo confiable almacenado en Redis
 */
export interface TrustedDeviceMetadata {
  browser: string
  os: string
  device: string
  ip: string
  createdAt: number
  lastUsedAt: number
}

/**
 * Lo que guardamos en Redis (Extiende la metadata + datos técnicos)
 */
export interface StoredTrustedDevice extends TrustedDeviceMetadata {
  userId: string
  fingerprint: string
}

/**
 * Repository para gestionar dispositivos confiables en Redis
 *
 * Usa la misma estrategia que TokenStorageRepository:
 * 1. Key individual: auth:trusted-device:{userId}:{fingerprint} → StoredTrustedDevice (JSON)
 * 2. Set key: auth:trusted-device:user-sets:{userId} → Set de fingerprints
 *
 * Ventajas:
 * - Búsqueda individual rápida por key
 * - Listar todos los dispositivos del usuario eficientemente (usando el Set)
 * - Borrar todos los dispositivos del usuario eficientemente
 * - Validar que un fingerprint pertenece al usuario (sismember)
 *
 * Límites de seguridad:
 * - Máximo 10 dispositivos confiables por usuario
 * - Limpieza automática de ghost members (fingerprints huérfanos en el Set)
 */
@Injectable()
export class TrustedDeviceRepository {
  private readonly MAX_DEVICES_PER_USER = 10
  private readonly DEVICE_TTL_DAYS = TRUSTED_DEVICE_CONFIG.ttlDays
  private readonly DEVICE_TTL_SECONDS = TimeUtil.toSeconds(
    `${this.DEVICE_TTL_DAYS}d`,
  )

  constructor(private readonly cacheService: CacheService) {}

  // --- LÓGICA DE KEY ---
  private getKey(userId: string, fingerprint: string): string {
    return `auth:trusted-device:${userId}:${fingerprint}`
  }

  private getUserSetKey(userId: string): string {
    return `auth:trusted-device:user-sets:${userId}`
  }

  // --- GUARDAR (Data + Índice) ---
  async save(
    userId: string,
    fingerprint: string,
    metadata: Omit<TrustedDeviceMetadata, 'createdAt' | 'lastUsedAt'>,
  ): Promise<void> {
    const key = this.getKey(userId, fingerprint)
    const setKey = this.getUserSetKey(userId)

    // 1. Verificar límite de dispositivos (seguridad)
    const currentFingerprints = await this.cacheService.smembers(setKey)

    // Si el dispositivo ya existe, lo actualizamos (no cuenta como nuevo)
    const isNewDevice = !currentFingerprints.includes(fingerprint)

    if (
      isNewDevice &&
      currentFingerprints.length >= this.MAX_DEVICES_PER_USER
    ) {
      // Límite alcanzado: borrar el dispositivo más viejo
      const devices = await this.getUserDevices(userId)

      if (devices.length > 0) {
        // El más viejo está al final (ordenados por lastUsedAt desc)
        const oldestDevice = devices[devices.length - 1]
        await this.delete(userId, oldestDevice.fingerprint)
      }
    }

    const deviceData: StoredTrustedDevice = {
      ...metadata,
      userId,
      fingerprint,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    }

    // 2. Guardar la data real
    await this.cacheService.setJSON(key, deviceData, this.DEVICE_TTL_SECONDS)

    // 3. Indexar (Set)
    await this.cacheService.sadd(setKey, fingerprint)
    await this.cacheService.expire(setKey, this.DEVICE_TTL_SECONDS)
  }

  // --- VALIDAR (Existencia + Pertenencia) ---
  /**
   * Verifica si un dispositivo es confiable
   *
   * IMPORTANTE: Verifica AMBAS cosas:
   * 1. Que el fingerprint esté en el Set (índice)
   * 2. Que el JSON del dispositivo realmente exista (no sea ghost member)
   *
   * Si detecta un ghost member, lo limpia automáticamente del Set.
   *
   * @param userId - ID del usuario
   * @param fingerprint - Fingerprint del dispositivo
   * @returns true si el dispositivo existe y es válido
   */
  async isTrusted(userId: string, fingerprint: string): Promise<boolean> {
    const setKey = this.getUserSetKey(userId)

    // 1. Verificar pertenencia en el Set (índice)
    const inSet = await this.cacheService.sismember(setKey, fingerprint)

    if (!inSet) {
      return false
    }

    // 2. Verificar que el JSON realmente existe (seguridad contra ghost members)
    const key = this.getKey(userId, fingerprint)
    const exists = await this.cacheService.exists(key)

    if (!exists) {
      // Ghost member detectado: el fingerprint está en el Set pero el JSON expiró
      // Limpieza automática para evitar bypass de 2FA
      await this.cacheService.srem(setKey, fingerprint)
      return false
    }

    return true
  }

  // --- OBTENER UNO ---
  async get(
    userId: string,
    fingerprint: string,
  ): Promise<StoredTrustedDevice | null> {
    const key = this.getKey(userId, fingerprint)
    return await this.cacheService.getJSON<StoredTrustedDevice>(key)
  }

  // --- ACTUALIZAR ÚLTIMA FECHA DE USO ---
  async updateLastUsed(userId: string, fingerprint: string): Promise<void> {
    const device = await this.get(userId, fingerprint)

    if (!device) return

    device.lastUsedAt = Date.now()

    // Renovar TTL completo al actualizar
    const key = this.getKey(userId, fingerprint)
    await this.cacheService.setJSON(key, device, this.DEVICE_TTL_SECONDS)
  }

  // --- OBTENER TODOS LOS DISPOSITIVOS DEL USUARIO ---
  async getUserDevices(userId: string): Promise<StoredTrustedDevice[]> {
    // 1. Obtener la lista de fingerprints (El Índice)
    const setKey = this.getUserSetKey(userId)
    const fingerprints = await this.cacheService.smembers(setKey)

    if (fingerprints.length === 0) {
      return []
    }

    // 2. Construir las keys de los detalles
    const keys = fingerprints.map((fp) => this.getKey(userId, fp))

    // 3. Obtener todos los JSONs en paralelo (Muy rápido)
    const devices = await Promise.all(
      keys.map((key) => this.cacheService.getJSON<StoredTrustedDevice>(key)),
    )

    // 4. Filtrar nulos y limpiar ghost members activamente
    const validDevices: StoredTrustedDevice[] = []
    const ghostFingerprints: string[] = []

    devices.forEach((device, index) => {
      if (device !== null) {
        validDevices.push(device)
      } else {
        // Ghost member detectado: el JSON expiró pero el fingerprint sigue en el Set
        ghostFingerprints.push(fingerprints[index])
      }
    })

    // 5. Limpiar ghost members del Set (sincronización activa)
    // Optimización: Un solo comando Redis en lugar de múltiples
    if (ghostFingerprints.length > 0) {
      await this.cacheService.srem(setKey, ...ghostFingerprints)
    }

    // 6. Ordenar por último uso (más reciente primero)
    return validDevices.sort((a, b) => b.lastUsedAt - a.lastUsedAt)
  }

  // --- BORRAR UNO (Data + Índice) ---
  async delete(userId: string, fingerprint: string): Promise<boolean> {
    const key = this.getKey(userId, fingerprint)
    const setKey = this.getUserSetKey(userId)

    const deleted = await this.cacheService.del(key)
    await this.cacheService.srem(setKey, fingerprint)

    return deleted
  }

  // --- BORRAR TODOS (Eficiente) ---
  async deleteAllForUser(userId: string): Promise<number> {
    const setKey = this.getUserSetKey(userId)
    const fingerprints = await this.cacheService.smembers(setKey)

    if (fingerprints.length === 0) {
      return 0
    }

    const keys = fingerprints.map((fp) => this.getKey(userId, fp))

    // Borrado en paralelo
    await Promise.all([
      ...keys.map((k) => this.cacheService.del(k)),
      this.cacheService.del(setKey),
    ])

    return fingerprints.length
  }
}

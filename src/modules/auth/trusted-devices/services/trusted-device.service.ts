import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'
import { CacheService } from '@core/cache'
import { AUTH_KEYS } from '../../shared/constants'

/**
 * Metadata de un dispositivo confiable almacenado en Redis
 */
export interface TrustedDeviceMetadata {
  browser: string
  os: string
  device: string
  ip: string
  createdAt: Date
  lastUsedAt: Date
}

/**
 * Datos para generar fingerprint de dispositivo
 */
export interface DeviceFingerprintData {
  userAgent: string
  ip?: string
  extraData?: string
}

/**
 * Servicio para gestionar dispositivos confiables (Trusted Devices)
 *
 * Permite a los usuarios marcar dispositivos como confiables para bypass automático
 * de 2FA durante un período configurable (por defecto 90 días).
 *
 * El fingerprint del dispositivo se genera usando SHA-256 de:
 * - User-Agent (navegador/OS)
 * - IP (opcional, para mayor seguridad)
 * - Extra data (opcional)
 * - Salt (del .env)
 *
 * IMPORTANTE: El fingerprint NO es un mecanismo de autenticación, solo un factor
 * de conveniencia. Siempre se validan las credenciales primero.
 */
@Injectable()
export class TrustedDeviceService {
  private readonly DEVICE_TTL_DAYS: number
  private readonly DEVICE_TTL_SECONDS: number
  private readonly FINGERPRINT_SALT: string

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    this.DEVICE_TTL_DAYS = this.configService.get<number>(
      'TRUSTED_DEVICE_TTL_DAYS',
      90,
    )
    this.DEVICE_TTL_SECONDS = this.DEVICE_TTL_DAYS * 24 * 60 * 60

    this.FINGERPRINT_SALT = this.configService.get<string>(
      'DEVICE_FINGERPRINT_SALT',
      'default-salt-change-me-in-production',
    )
  }

  /**
   * Genera fingerprint SHA-256 del dispositivo
   *
   * El fingerprint es un hash de:
   * - User-Agent (navegador/OS)
   * - IP (opcional, para mayor seguridad)
   * - Extra data (opcional, puede ser canvas fingerprint, etc)
   * - Salt (del .env)
   *
   * IMPORTANTE: El frontend debe generar el mismo fingerprint consistentemente
   * si quiere proveer su propio fingerprint.
   *
   * @param userAgent - User-Agent del navegador
   * @param ip - Dirección IP del cliente (opcional)
   * @returns Hash SHA-256 hexadecimal (64 caracteres)
   */
  generateFingerprint(userAgent: string, ip?: string): string {
    const input = `${userAgent}|${ip || ''}|${this.FINGERPRINT_SALT}`
    return crypto.createHash('sha256').update(input).digest('hex')
  }

  /**
   * Parsea User-Agent para extraer información del dispositivo
   *
   * Detección simplificada de navegador, OS y tipo de dispositivo.
   * En producción, considerar usar librería especializada como 'ua-parser-js'.
   *
   * @param userAgent - User-Agent string del navegador
   * @returns Información del dispositivo (browser, os, device)
   */
  parseUserAgent(userAgent: string): {
    browser: string
    os: string
    device: string
  } {
    const browser = this.detectBrowser(userAgent)
    const os = this.detectOS(userAgent)
    const device = this.detectDevice(userAgent)

    return { browser, os, device }
  }

  /**
   * Agrega un dispositivo como confiable
   *
   * Almacena el dispositivo en Redis con TTL configurable (90 días por defecto).
   * El dispositivo permite bypass automático de 2FA hasta que expire o sea revocado.
   *
   * @param userId - ID del usuario
   * @param fingerprint - Fingerprint SHA-256 del dispositivo
   * @param metadata - Información del dispositivo (browser, os, etc.)
   */
  async addTrustedDevice(
    userId: string,
    fingerprint: string,
    metadata: Omit<TrustedDeviceMetadata, 'createdAt' | 'lastUsedAt'>,
  ): Promise<void> {
    const key = AUTH_KEYS.TRUSTED_DEVICE(userId, fingerprint)

    const data: TrustedDeviceMetadata = {
      ...metadata,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    }

    await this.cacheService.setJSON(key, data, this.DEVICE_TTL_SECONDS)
  }

  /**
   * Verifica si un dispositivo es confiable
   *
   * @param userId - ID del usuario
   * @param fingerprint - Fingerprint SHA-256 del dispositivo
   * @returns true si el dispositivo existe y no ha expirado
   */
  async isTrustedDevice(userId: string, fingerprint: string): Promise<boolean> {
    const key = AUTH_KEYS.TRUSTED_DEVICE(userId, fingerprint)
    return await this.cacheService.exists(key)
  }

  /**
   * Actualiza la última fecha de uso de un dispositivo
   *
   * Renueva el TTL completo al actualizar (refresca los 90 días).
   * Útil para mantener dispositivos activos como confiables.
   *
   * @param userId - ID del usuario
   * @param fingerprint - Fingerprint SHA-256 del dispositivo
   */
  async updateLastUsed(userId: string, fingerprint: string): Promise<void> {
    const key = AUTH_KEYS.TRUSTED_DEVICE(userId, fingerprint)
    const metadata = await this.cacheService.getJSON<TrustedDeviceMetadata>(key)

    if (!metadata) return

    try {
      metadata.lastUsedAt = new Date()

      // Renovar TTL completo al actualizar
      await this.cacheService.setJSON(key, metadata, this.DEVICE_TTL_SECONDS)
    } catch (error) {
      // JSON corrupto, ignorar
      console.error('Error parsing trusted device metadata:', error)
    }
  }

  /**
   * Obtiene todos los dispositivos confiables de un usuario
   *
   * @param userId - ID del usuario
   * @returns Array de dispositivos con su metadata y fingerprint
   */
  async getTrustedDevices(
    userId: string,
  ): Promise<Array<TrustedDeviceMetadata & { fingerprint: string }>> {
    const pattern = AUTH_KEYS.USER_TRUSTED_DEVICES(userId)
    const keys = await this.cacheService.keys(pattern)

    const devices: Array<TrustedDeviceMetadata & { fingerprint: string }> = []

    for (const key of keys) {
      const metadata = await this.cacheService.getJSON<TrustedDeviceMetadata>(
        key,
      )
      if (!metadata) continue

      try {
        // Extraer fingerprint del key: auth:trusted-device:{userId}:{fingerprint}
        const fingerprint = key.split(':').pop() || ''
        devices.push({ ...metadata, fingerprint })
      } catch (error) {
        // JSON corrupto, ignorar
        console.error('Error parsing trusted device metadata:', error)
      }
    }

    // Ordenar por último uso (más reciente primero)
    return devices.sort(
      (a, b) =>
        new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime(),
    )
  }

  /**
   * Elimina un dispositivo confiable
   *
   * @param userId - ID del usuario
   * @param fingerprint - Fingerprint SHA-256 del dispositivo
   * @returns true si el dispositivo fue eliminado, false si no existía
   */
  async removeTrustedDevice(
    userId: string,
    fingerprint: string,
  ): Promise<boolean> {
    const key = AUTH_KEYS.TRUSTED_DEVICE(userId, fingerprint)
    const result = await this.cacheService.del(key)
    return result > 0
  }

  /**
   * Elimina TODOS los dispositivos confiables de un usuario
   *
   * Casos de uso:
   * - Usuario cambió su contraseña (seguridad)
   * - Usuario desactiva 2FA (opcional, decisión de producto)
   * - Admin revoca acceso por seguridad
   *
   * @param userId - ID del usuario
   * @returns Número de dispositivos eliminados
   */
  async revokeAllUserDevices(userId: string): Promise<number> {
    const pattern = AUTH_KEYS.USER_TRUSTED_DEVICES(userId)
    return await this.cacheService.delByPattern(pattern)
  }

  // ============================================
  // HELPERS PRIVADOS PARA PARSING DE USER-AGENT
  // ============================================

  /**
   * Detecta el navegador desde el User-Agent
   * Detección simplificada - considera usar ua-parser-js en producción
   */
  private detectBrowser(ua: string): string {
    if (ua.includes('Edg')) return 'Edge'
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
    return 'Unknown'
  }

  /**
   * Detecta el sistema operativo desde el User-Agent
   */
  private detectOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac OS')) return 'macOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad'))
      return 'iOS'
    return 'Unknown'
  }

  /**
   * Detecta el tipo de dispositivo desde el User-Agent
   */
  private detectDevice(ua: string): string {
    if (ua.includes('Mobile') || ua.includes('Android')) return 'Mobile'
    if (ua.includes('Tablet') || ua.includes('iPad')) return 'Tablet'
    return 'Desktop'
  }
}

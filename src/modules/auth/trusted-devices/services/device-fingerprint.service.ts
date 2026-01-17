import { Injectable } from '@nestjs/common'
import * as crypto from 'crypto'
import { TRUSTED_DEVICE_CONFIG } from '../config/trusted-device.config'

/**
 * Datos para generar fingerprint de dispositivo
 */
export interface DeviceFingerprintData {
  userAgent: string
  ip?: string
  extraData?: string
}

/**
 * Servicio para generar fingerprints de dispositivos y parsear User-Agent
 *
 * Responsabilidades:
 * - Generar fingerprints SHA-256 consistentes
 * - Parsear User-Agent para extraer información (browser, OS, device)
 *
 * IMPORTANTE: El fingerprint NO es un mecanismo de autenticación, solo un factor
 * de conveniencia. Siempre se validan las credenciales primero.
 */
@Injectable()
export class DeviceFingerprintService {
  private readonly FINGERPRINT_SALT = TRUSTED_DEVICE_CONFIG.fingerprintSalt

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

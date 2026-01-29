import { Injectable } from '@nestjs/common'
import { createHash } from 'crypto'
import { UAParser, type IResult } from 'ua-parser-js'
import type {
  ConnectionMetadata,
  ParsedConnectionMetadata,
} from '../interfaces'

/**
 * Servicio centralizado para procesar metadata de conexión HTTP
 *
 * Responsabilidades:
 * - Parsear User-Agent usando ua-parser-js
 * - Extraer información del navegador, OS, dispositivo
 * - Estandarizar formato de la metadata procesada
 *
 * Casos de uso:
 * - Auth: Guardar metadata de sesión (browser, OS, device)
 * - Logging: Enriquecer logs con info del cliente
 * - Auditoría: Registrar quién hace qué desde dónde
 * - Seguridad: Detectar cambios de dispositivo/ubicación
 */
@Injectable()
export class ConnectionMetadataService {
  /**
   * Parsea metadata cruda de conexión y devuelve objeto estructurado
   *
   * @param metadata - Metadata cruda extraída de la Request
   * @returns Metadata procesada con browser, OS, device, fingerprints parseados
   *
   * @example
   * ```typescript
   * const connection = { ip: '192.168.1.1', rawUserAgent: 'Mozilla/5.0...' }
   * const parsed = this.connectionMetadataService.parse(connection)
   * // parsed.browser = "Chrome 120.0"
   * // parsed.os = "Windows 11"
   * // parsed.device = "Desktop"
   * // parsed.fingerprint = "a1b2c3..." (con IP)
   * // parsed.fingerprintWithoutIp = "d4e5f6..." (sin IP)
   * ```
   */
  parse(metadata: ConnectionMetadata): ParsedConnectionMetadata {
    const parser = new UAParser(metadata.rawUserAgent)
    const result: IResult = parser.getResult()

    // Parsear idioma (toma el primer idioma de accept-language)
    // Ejemplo: "en-US,en;q=0.9,es;q=0.8" → "en-US"
    const language = metadata.acceptLanguage?.split(',')[0].trim()

    // Generar fingerprints (con y sin IP)
    const fingerprint = this.generateFingerprint(
      metadata.ip,
      metadata.rawUserAgent,
      metadata.acceptLanguage,
    )

    const fingerprintWithoutIp = this.generateFingerprintWithoutIp(
      metadata.rawUserAgent,
      metadata.acceptLanguage,
    )

    // Extraer propiedades con type-safe access
    const browserName = result.browser?.name
    const browserVersion = result.browser?.version
    const osName = result.os?.name
    const osVersion = result.os?.version
    const deviceType = result.device?.type

    return {
      ip: metadata.ip,
      userAgent: metadata.rawUserAgent,
      browser: this.formatBrowser(browserName, browserVersion),
      os: this.formatOS(osName, osVersion),
      device: this.formatDevice(deviceType),
      language,
      fingerprint,
      fingerprintWithoutIp,
    }
  }

  /**
   * Versión simplificada que solo necesita IP y User-Agent
   * (útil cuando no tienes el decorador disponible)
   */
  parseFromRaw(ip: string, userAgent: string): ParsedConnectionMetadata {
    return this.parse({
      ip,
      rawUserAgent: userAgent,
    })
  }

  // --- Helpers de formateo ---

  private formatBrowser(name?: string, version?: string): string {
    if (!name) return 'Unknown'
    return version ? `${name} ${version}`.trim() : name
  }

  private formatOS(name?: string, version?: string): string {
    if (!name) return 'Unknown'
    return version ? `${name} ${version}`.trim() : name
  }

  private formatDevice(type?: string): string {
    // ua-parser-js devuelve: mobile, tablet, console, smarttv, wearable, embedded
    // Si no hay tipo específico, asumimos Desktop
    if (!type) return 'Desktop'

    // Capitalize first letter
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  // --- Generación de fingerprints ---

  /**
   * Genera fingerprint único CON IP
   *
   * Más restrictivo: detecta cambio de red como dispositivo diferente.
   * Útil para:
   * - Detección de sesiones sospechosas (mismo user desde IPs diferentes)
   * - Seguridad estricta
   *
   * @param ip - Dirección IP
   * @param userAgent - User-Agent del navegador
   * @param acceptLanguage - Accept-Language header (opcional)
   * @returns Hash SHA-256 en formato hexadecimal
   */
  generateFingerprint(
    ip: string,
    userAgent: string,
    acceptLanguage?: string,
  ): string {
    const data = `${ip}|${userAgent}|${acceptLanguage || ''}`
    return createHash('sha256').update(data).digest('hex')
  }

  /**
   * Genera fingerprint SIN IP
   *
   * Menos restrictivo: identifica mismo dispositivo aunque cambie de red.
   * Útil para:
   * - Trusted devices (usuario se mueve entre WiFi y 4G)
   * - "Remember me" que sobrevive cambios de red
   *
   * @param userAgent - User-Agent del navegador
   * @param acceptLanguage - Accept-Language header (opcional)
   * @returns Hash SHA-256 en formato hexadecimal
   */
  generateFingerprintWithoutIp(
    userAgent: string,
    acceptLanguage?: string,
  ): string {
    const data = `${userAgent}|${acceptLanguage || ''}`
    return createHash('sha256').update(data).digest('hex')
  }
}

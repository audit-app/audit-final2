/**
 * Metadata cruda de la conexión HTTP (sin procesar)
 * Extraída directamente de los headers de la Request
 */
export interface ConnectionMetadata {
  /** Dirección IP del cliente (considera x-forwarded-for para proxies/load balancers) */
  ip: string

  /** User-Agent sin procesar */
  rawUserAgent: string

  /** Accept-Language header (útil para fingerprinting y localización) */
  acceptLanguage?: string
}

/**
 * Metadata procesada de la conexión (parseada con ua-parser-js)
 * Lista para ser usada en sesiones, logs, auditoría, etc.
 */
export interface ParsedConnectionMetadata {
  /** Dirección IP del cliente */
  ip: string

  /** User-Agent original (crudo) */
  userAgent: string

  /** Navegador parseado (ej: "Chrome 120.0") */
  browser: string

  /** Sistema operativo parseado (ej: "Windows 11") */
  os: string

  /** Tipo de dispositivo (ej: "Desktop", "Mobile", "Tablet") */
  device: string

  /** Idioma preferido del cliente (si está disponible) */
  language?: string

  /**
   * Fingerprint único del dispositivo (INCLUYE IP)
   * Hash SHA-256 de: IP + User-Agent + Accept-Language
   * Más restrictivo: detecta cambio de red como dispositivo diferente
   */
  fingerprint: string

  /**
   * Fingerprint sin IP (SOLO dispositivo)
   * Hash SHA-256 de: User-Agent + Accept-Language
   * Menos restrictivo: mismo dispositivo aunque cambie de red (WiFi → 4G)
   */
  fingerprintWithoutIp: string
}

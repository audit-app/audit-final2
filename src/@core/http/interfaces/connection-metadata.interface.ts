/**
 * Metadata cruda de la conexión HTTP (sin procesar)
 * Extraída directamente de los headers de la Request
 */
export interface ConnectionMetadata {
  ip: string
  rawUserAgent: string
  acceptLanguage?: string
}

/**
 * Metadata procesada de la conexión (parseada con ua-parser-js)
 * Lista para ser usada en sesiones, logs, auditoría, etc.
 */
export interface ParsedConnectionMetadata {
  ip: string
  userAgent: string
  browser: string
  os: string
  device: string
  language?: string
  fingerprint: string
  fingerprintWithoutIp: string
}

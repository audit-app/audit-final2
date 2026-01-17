/**
 * Configuración de Trusted Devices (Dispositivos Confiables)
 *
 * Variables de entorno:
 * - TRUSTED_DEVICE_TTL_DAYS: Días de validez del dispositivo confiable (default: 90)
 * - DEVICE_FINGERPRINT_SALT: Salt para generar fingerprints (default: 'default-salt-change-me-in-production')
 */
export const TRUSTED_DEVICE_CONFIG = {
  ttlDays: parseInt(process.env.TRUSTED_DEVICE_TTL_DAYS || '90', 10),
  fingerprintSalt:
    process.env.DEVICE_FINGERPRINT_SALT ||
    'default-salt-change-me-in-production',
} as const

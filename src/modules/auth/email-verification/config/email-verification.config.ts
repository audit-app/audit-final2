/**
 * Configuración de Email Verification
 *
 * Variables de entorno:
 * - EMAIL_VERIFICATION_EXPIRES_IN: Tiempo de expiración del token (default: '7d')
 *
 * ESTRATEGIA UNIFICADA: Usa OtpCoreService (igual que 2FA y reset-password)
 * ===========================================================================
 * - TokenId: String aleatorio de 64 caracteres hexadecimales
 * - Payload: { userId, email }
 * - Almacenamiento: Redis con TTL de 7 días
 * - Key: auth:email-verification:{tokenId}
 * - Value: JSON { code: 'N/A', payload: {userId, email} }
 * - One-time use: Se elimina de Redis después de validar
 *
 * IMPORTANTE: A diferencia de 2FA, NO se genera código OTP visible
 * Solo usamos el tokenId como identificador único en el enlace del email
 *
 * Ventajas de unificar con OtpCoreService:
 * - Reutilización de código probado
 * - Consistencia con otros flujos (2FA, reset-password)
 * - Elimina dependencia de jsonwebtoken
 * - Simplifica la lógica (no necesita JWT signing/verification)
 * - Mantenimiento centralizado
 *
 * Seguridad implementada:
 * - TokenId aleatorio de 256 bits (64 chars hex)
 * - One-time use (se elimina de Redis después de validar)
 * - Expira en 7 días (TTL automático)
 * - Throttler global protege el endpoint
 */
export const EMAIL_VERIFICATION_CONFIG = {
  jwt: {
    expiresIn: process.env.EMAIL_VERIFICATION_EXPIRES_IN || '7d', // 7 días
  },
} as const

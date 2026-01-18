/**
 * Configuración de Email Verification
 *
 * Variables de entorno:
 * - EMAIL_VERIFICATION_JWT_SECRET: Secret para firmar JWTs (REQUERIDO, diferente a JWT_SECRET)
 * - EMAIL_VERIFICATION_EXPIRES_IN: Tiempo de expiración del token (default: '7d')
 *
 * ESTRATEGIA: JWT Puro (sin Redis para almacenar sesión)
 * =======================================================
 * A diferencia de 2FA y reset-password, la verificación de email:
 * - Es menos sensible (no expone contraseñas)
 * - Se envía UNA sola vez al registrarse
 * - El usuario tiene 7 días para verificar
 * - No requiere rate limiting complejo (Throttler global es suficiente)
 *
 * Cómo funciona:
 * 1. Al registrarse → Generar JWT con userId + email (TTL: 7 días)
 * 2. Enviar enlace con JWT al email del usuario
 * 3. Usuario hace clic → Validar JWT
 * 4. Si JWT válido → Marcar email como verificado
 * 5. One-time use: Marcar token como usado en Redis (prevenir reutilización)
 *
 * Ventajas del JWT:
 * - Stateless: No necesita Redis para almacenar sesión
 * - Auto-expirable: El JWT expira solo después de 7 días
 * - Firma criptográfica: No se puede falsificar
 * - Contiene datos: userId, email, iat, exp
 *
 * Redis solo para:
 * - Marcar tokens como usados (one-time use)
 * - TTL igual al del JWT (7 días)
 *
 * Seguridad:
 * - Firma diferente a los access tokens (EMAIL_VERIFICATION_JWT_SECRET)
 * - One-time use (se marca como usado en Redis)
 * - Expira en 7 días
 * - Throttler global protege el endpoint
 */
export const EMAIL_VERIFICATION_CONFIG = {
  jwt: {
    secret: process.env.EMAIL_VERIFICATION_JWT_SECRET || '',
    expiresIn: process.env.EMAIL_VERIFICATION_EXPIRES_IN || '7d', // 7 días
  },
} as const

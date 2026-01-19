export const TWO_FACTOR_CONFIG = {
  code: {
    length: parseInt(process.env.TWO_FACTOR_CODE_LENGTH || '6', 10),
    expiresIn: parseInt(process.env.TWO_FACTOR_CODE_EXPIRES_IN || '300', 10), // 5 minutos en segundos
  },
  rateLimit: {
    // Límite para resend (evita spam de emails)
    resend: {
      cooldownSeconds: parseInt(
        process.env.TWO_FACTOR_RESEND_COOLDOWN_SECONDS || '60',
        10,
      ),
    },
    // Límite para verificación (seguridad contra brute force)
    verify: {
      maxAttempts: parseInt(
        process.env.TWO_FACTOR_VERIFY_MAX_ATTEMPTS || '3',
        10,
      ),
      windowMinutes: parseInt(
        process.env.TWO_FACTOR_VERIFY_WINDOW_MINUTES || '10',
        10,
      ), // Ventana de tiempo para intentos
    },
  },
} as const

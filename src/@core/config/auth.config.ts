import { registerAs } from '@nestjs/config'

export interface AuthConfig {
  jwt: {
    access: {
      secret: string
      expiresIn: string
    }
    refresh: {
      secret: string
      expiresIn: string
      expirationTime: number // En segundos para Redis TTL
    }
  }
  twoFactor: {
    code: {
      length: number
      expiresIn: string
    }
    jwt: {
      secret: string
    }
    trustedDevice: {
      expirationDays: number
      expirationSeconds: number
    }
    rateLimit: {
      resendCooldownSeconds: number
      verifyMaxAttempts: number
      verifyWindowMinutes: number
    }
  }
  passwordReset: {
    jwt: {
      secret: string
    }
    token: {
      expiresIn: string
    }
    rateLimit: {
      resendCooldownSeconds: number
      maxAttemptsByEmail: number
      windowMinutes: number
    }
  }
  emailVerification: {
    jwt: {
      secret: string
    }
  }
  login: {
    rateLimit: {
      maxAttemptsByIp: number
      maxAttemptsByUser: number
      windowMinutes: number
    }
  }
  session: {
    secret: string
    maxAge: number
  }
  deviceFingerprint: {
    salt: string
  }
  google: {
    clientId: string
    clientSecret: string
    callbackUrl: string
    defaultOrganizationId: string | null
  }
}

/**
 * Convierte una cadena de tiempo (1h, 5m, 7d) a segundos
 */
function parseTimeToSeconds(timeStr: string): number {
  const units: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  }

  const match = timeStr.match(/^(\d+)([smhd])$/)
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`)
  }

  const [, value, unit] = match
  return parseInt(value, 10) * units[unit]
}

export const authConfig = registerAs('auth', (): AuthConfig => {
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  const trustedDeviceDays = parseInt(
    process.env.TRUSTED_DEVICE_TTL_DAYS || '90',
    10,
  )

  return {
    jwt: {
      access: {
        secret:
          process.env.JWT_SECRET ||
          'your-super-secret-jwt-key-change-this-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      },
      refresh: {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          'your-super-secret-refresh-key-change-this-in-production',
        expiresIn: refreshExpiresIn,
        expirationTime: parseTimeToSeconds(refreshExpiresIn),
      },
    },
    twoFactor: {
      code: {
        length: parseInt(process.env.TWO_FACTOR_CODE_LENGTH || '6', 10),
        expiresIn: process.env.TWO_FACTOR_CODE_EXPIRES_IN || '5m',
      },
      jwt: {
        secret:
          process.env.TWO_FACTOR_JWT_SECRET ||
          'your-2fa-jwt-secret-change-in-production',
      },
      trustedDevice: {
        expirationDays: trustedDeviceDays,
        expirationSeconds: trustedDeviceDays * 24 * 60 * 60,
      },
      rateLimit: {
        resendCooldownSeconds: parseInt(
          process.env.TWO_FACTOR_RESEND_COOLDOWN_SECONDS || '60',
          10,
        ),
        verifyMaxAttempts: parseInt(
          process.env.TWO_FACTOR_VERIFY_MAX_ATTEMPTS || '3',
          10,
        ),
        verifyWindowMinutes: parseInt(
          process.env.TWO_FACTOR_VERIFY_WINDOW_MINUTES || '10',
          10,
        ),
      },
    },
    passwordReset: {
      jwt: {
        secret:
          process.env.RESET_PASSWORD_JWT_SECRET ||
          'your-reset-password-jwt-secret-change-in-production',
      },
      token: {
        expiresIn: process.env.RESET_PASSWORD_TOKEN_EXPIRES_IN || '1h',
      },
      rateLimit: {
        maxAttemptsByEmail: parseInt(
          process.env.MAX_RESET_PASSWORD_ATTEMPTS_EMAIL || '10',
          10,
        ),
        windowMinutes: parseInt(
          process.env.RESET_PASSWORD_ATTEMPTS_WINDOW_MINUTES || '60',
          10,
        ),
        resendCooldownSeconds: parseInt(
          process.env.TWO_FACTOR_RESEND_COOLDOWN_SECONDS || '60',
          10,
        ),
      },
    },
    emailVerification: {
      jwt: {
        secret:
          process.env.EMAIL_VERIFICATION_JWT_SECRET ||
          'your-email-verification-jwt-secret-change-this-in-production',
      },
    },
    login: {
      rateLimit: {
        maxAttemptsByIp: parseInt(
          process.env.MAX_LOGIN_ATTEMPTS_IP || '10',
          10,
        ),
        maxAttemptsByUser: parseInt(
          process.env.MAX_LOGIN_ATTEMPTS_USER || '5',
          10,
        ),
        windowMinutes: parseInt(
          process.env.LOGIN_ATTEMPTS_WINDOW_MINUTES || '15',
          10,
        ),
      },
    },
    session: {
      secret:
        process.env.SESSION_SECRET ||
        'your-session-secret-change-this-in-production',
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10),
    },
    deviceFingerprint: {
      salt:
        process.env.DEVICE_FINGERPRINT_SALT ||
        'default-salt-change-in-production',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/api/auth/google/callback',
      defaultOrganizationId: process.env.DEFAULT_ORGANIZATION_ID || null,
    },
  }
})

/**
 * EJEMPLO DE USO DEL NUEVO SISTEMA DE CONFIGURACIÓN
 *
 * Este archivo muestra cómo usar `envs` en lugar de `AppConfigService`
 */

import { envs } from './envs'

// ============================================
// ✅ EJEMPLO 1: Acceso directo (sin DI)
// ============================================
export class EmailService {
  // ❌ ANTES: constructor(private config: AppConfigService) {}
  // ✅ AHORA: Sin constructor!

  async sendEmail() {
    // ❌ ANTES: this.config.email.host
    // ✅ AHORA: envs.email.host
    const smtpConfig = {
      host: envs.email.host,
      port: envs.email.port,
      secure: envs.email.secure,
      auth: {
        user: envs.email.user,
        pass: envs.email.password,
      },
    }

    console.log('SMTP Config:', smtpConfig)
  }
}

// ============================================
// ✅ EJEMPLO 2: JWT Strategy
// ============================================
export class JwtStrategy {
  constructor() {
    // ❌ ANTES: necesitabas inyectar AppConfigService
    // ✅ AHORA: acceso directo
    const jwtConfig = {
      secretOrKey: envs.jwt.accessSecret,
      expiresIn: envs.jwt.accessExpiresIn,
    }

    console.log('JWT Config:', jwtConfig)
  }
}

// ============================================
// ✅ EJEMPLO 3: Redis Connection
// ============================================
export function createRedisConnection() {
  return {
    host: envs.redis.host,
    port: envs.redis.port,
    password: envs.redis.password || undefined,
    db: envs.redis.db,
  }
}

// ============================================
// ✅ EJEMPLO 4: Condicionales basados en entorno
// ============================================
export function setupLogger() {
  if (envs.app.isDevelopment) {
    console.log('🔧 Development mode - verbose logging enabled')
  }

  if (envs.app.isProduction) {
    console.log('🚀 Production mode - minimal logging')
  }

  return {
    level: envs.log.level,
    environment: envs.app.nodeEnv,
  }
}

// ============================================
// ✅ EJEMPLO 5: CORS Configuration
// ============================================
export function getCorsConfig() {
  return {
    origin: envs.security.corsOrigins, // ← Ya parseado como array!
    credentials: true,
  }
}

// ============================================
// ✅ EJEMPLO 6: App Startup Info
// ============================================
export function logStartupInfo() {
  console.log(`
╔═══════════════════════════════════════════╗
║  🚀 ${envs.app.name.toUpperCase().padEnd(36)} ║
╠═══════════════════════════════════════════╣
║  Environment: ${envs.app.nodeEnv.padEnd(27)} ║
║  Port:        ${envs.app.port.toString().padEnd(27)} ║
║  URL:         ${envs.app.url.padEnd(27)} ║
║  Swagger:     ${(envs.app.url + '/' + envs.swagger.path).padEnd(27)} ║
╚═══════════════════════════════════════════╝
  `)

  console.log('📊 Configuration Summary:')
  console.log('  - Database:', envs.database.url.split('@')[1] || 'configured')
  console.log('  - Redis:', `${envs.redis.host}:${envs.redis.port}`)
  console.log('  - CORS Origins:', envs.security.corsOrigins.join(', '))
  console.log('  - Max File Size:', `${envs.files.maxFileSize / 1024 / 1024}MB`)
  console.log('  - Bcrypt Rounds:', envs.security.bcryptRounds)
  console.log('  - Pagination Default:', envs.pagination.defaultPageSize)
}

// ============================================
// ✅ EJEMPLO 7: Rate Limiting Config
// ============================================
export function getThrottleConfig() {
  return {
    ttl: envs.security.throttleTtl,
    limit: envs.security.throttleLimit,
  }
}

// ============================================
// ✅ EJEMPLO 8: 2FA Configuration
// ============================================
export function get2FAConfig() {
  return {
    codeLength: envs.twoFactor.codeLength,
    expiresIn: envs.twoFactor.codeExpiresIn,
    jwtSecret: envs.twoFactor.jwtSecret,
    maxAttempts: envs.twoFactor.verifyMaxAttempts,
    trustedDeviceDays: envs.twoFactor.trustedDeviceExpirationDays,
  }
}

// ============================================
// EJECUTAR EJEMPLOS
// ============================================
if (require.main === module) {
  console.log('🧪 Testing new config system...\n')

  logStartupInfo()

  console.log('\n📧 Email Service Config:', {
    host: envs.email.host,
    port: envs.email.port,
    from: envs.email.from,
  })

  console.log('\n🔐 JWT Config:', {
    accessExpires: envs.jwt.accessExpiresIn,
    refreshExpires: envs.jwt.refreshExpiresIn,
  })

  console.log('\n🔒 2FA Config:', get2FAConfig())

  console.log('\n🌐 CORS Config:', getCorsConfig())

  console.log('\n⏱️  Throttle Config:', getThrottleConfig())

  console.log('\n✅ All configs loaded successfully!')
}

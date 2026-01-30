/**
 * Script de prueba para verificar la configuración de 2FA
 */

import { envs } from '@core/config'

// Helper para parsear tiempo a segundos
function parseTimeToSeconds(value: string | number): number {
  if (typeof value === 'number') return value
  if (/^\d+$/.test(value)) return parseInt(value, 10)
  const match = value.match(/^(\d+)([smh])$/)
  if (match) {
    const [, num, unit] = match
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600 }
    return parseInt(num, 10) * multipliers[unit]
  }
  return 0
}

console.log('🔍 Verificando configuración de 2FA...\n')

const codeExpiresInSeconds = parseTimeToSeconds(envs.twoFactor.codeExpiresIn)

console.log('📋 Configuración actual:')
console.log('  - Longitud del código:', envs.twoFactor.codeLength, 'dígitos')
console.log('  - Expiración:', codeExpiresInSeconds, 'segundos')
console.log(
  '  - Resend cooldown:',
  envs.twoFactor.resendCooldownSeconds,
  'segundos',
)
console.log('  - Max intentos:', envs.twoFactor.verifyMaxAttempts)
console.log(
  '  - Ventana de intentos:',
  envs.twoFactor.verifyWindowMinutes,
  'minutos',
)
console.log('')

// Validaciones
const errors: string[] = []
const warnings: string[] = []

if (envs.twoFactor.codeLength < 4 || envs.twoFactor.codeLength > 8) {
  errors.push('❌ La longitud del código debe estar entre 4 y 8 dígitos')
}

if (codeExpiresInSeconds < 60) {
  warnings.push(
    '⚠️  Expiración muy corta (< 1 minuto). Puede causar problemas de usabilidad.',
  )
}

if (codeExpiresInSeconds > 600) {
  warnings.push(
    '⚠️  Expiración muy larga (> 10 minutos). Puede ser un riesgo de seguridad.',
  )
}

if (codeExpiresInSeconds >= 60 && codeExpiresInSeconds <= 600) {
  console.log(
    '✅ Expiración del código OK:',
    `${codeExpiresInSeconds / 60} minutos`,
  )
}

if (!envs.twoFactor.jwtSecret || envs.twoFactor.jwtSecret.length < 32) {
  errors.push('❌ TWO_FACTOR_JWT_SECRET debe tener al menos 32 caracteres')
} else {
  console.log('✅ TWO_FACTOR_JWT_SECRET configurado correctamente')
}

// Mostrar errores y warnings
if (errors.length > 0) {
  console.log('\n🚨 ERRORES CRÍTICOS:')
  errors.forEach((error) => console.log('  ', error))
}

if (warnings.length > 0) {
  console.log('\n⚠️  ADVERTENCIAS:')
  warnings.forEach((warning) => console.log('  ', warning))
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ Configuración de 2FA correcta!')
} else if (errors.length > 0) {
  console.log('\n❌ Hay errores que deben corregirse antes de usar 2FA')
  process.exit(1)
}

console.log('')

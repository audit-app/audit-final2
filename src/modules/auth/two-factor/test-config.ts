/**
 * Script de prueba para verificar la configuración de 2FA
 */

import 'dotenv/config' // Cargar .env primero
import { TWO_FACTOR_CONFIG } from './config/two-factor.config'

console.log('🔍 Verificando configuración de 2FA...\n')

console.log('📋 Configuración actual:')
console.log('  - Longitud del código:', TWO_FACTOR_CONFIG.code.length, 'dígitos')
console.log('  - Expiración:', TWO_FACTOR_CONFIG.code.expiresIn, 'segundos')
console.log('  - Resend cooldown:', TWO_FACTOR_CONFIG.rateLimit.resend.cooldownSeconds, 'segundos')
console.log('  - Max intentos:', TWO_FACTOR_CONFIG.rateLimit.verify.maxAttempts)
console.log('  - Ventana de intentos:', TWO_FACTOR_CONFIG.rateLimit.verify.windowMinutes, 'minutos')
console.log('')

// Validaciones
const errors: string[] = []
const warnings: string[] = []

if (TWO_FACTOR_CONFIG.code.length < 4 || TWO_FACTOR_CONFIG.code.length > 8) {
  errors.push('❌ La longitud del código debe estar entre 4 y 8 dígitos')
}

if (TWO_FACTOR_CONFIG.code.expiresIn < 60) {
  warnings.push('⚠️  Expiración muy corta (< 1 minuto). Puede causar problemas de usabilidad.')
}

if (TWO_FACTOR_CONFIG.code.expiresIn > 600) {
  warnings.push('⚠️  Expiración muy larga (> 10 minutos). Puede ser un riesgo de seguridad.')
}

if (TWO_FACTOR_CONFIG.code.expiresIn >= 60 && TWO_FACTOR_CONFIG.code.expiresIn <= 600) {
  console.log('✅ Expiración del código OK:', `${TWO_FACTOR_CONFIG.code.expiresIn / 60} minutos`)
}

if (!process.env.TWO_FACTOR_JWT_SECRET || process.env.TWO_FACTOR_JWT_SECRET.length < 32) {
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

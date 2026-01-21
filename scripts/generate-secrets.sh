#!/bin/bash

# Script para generar secrets seguros para .env

echo "🔐 Generando secrets seguros para tu .env"
echo ""
echo "Copia estos valores a tu archivo .env:"
echo ""
echo "# ============================================"
echo "# SECRETS GENERADOS ($(date))"
echo "# ============================================"
echo ""

# Función para generar secret de 32 bytes (44 caracteres en base64)
generate_secret() {
  openssl rand -base64 32 | tr -d '\n'
}

echo "# JWT Secrets (mínimo 32 caracteres)"
echo "JWT_SECRET=$(generate_secret)"
echo "JWT_REFRESH_SECRET=$(generate_secret)"
echo ""

echo "# Two-Factor Auth"
echo "TWO_FACTOR_JWT_SECRET=$(generate_secret)"
echo ""

echo "# Password Reset"
echo "RESET_PASSWORD_JWT_SECRET=$(generate_secret)"
echo ""

echo "# Email Verification"
echo "EMAIL_VERIFICATION_JWT_SECRET=$(generate_secret)"
echo ""

echo "# Session"
echo "SESSION_SECRET=$(generate_secret)"
echo ""

echo "# Device Fingerprint (mínimo 16 caracteres)"
echo "DEVICE_FINGERPRINT_SALT=$(openssl rand -base64 24 | tr -d '\n')"
echo ""

echo "# Throttle (rate limiting)"
echo "THROTTLE_TTL=60000  # 1 minuto en milisegundos"
echo "THROTTLE_LIMIT=100  # 100 requests por minuto"
echo ""

echo "# ============================================"
echo ""
echo "✅ Secrets generados exitosamente!"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  1. Copia estos valores a tu .env"
echo "  2. NUNCA commitees estos secrets al repositorio"
echo "  3. Cada ambiente (dev/staging/prod) debe tener secrets diferentes"
echo ""

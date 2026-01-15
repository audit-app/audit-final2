#!/bin/bash

# Script de prueba CORS
API_URL="http://localhost:3001/api"
ORIGIN="http://localhost:8080"

echo "================================================"
echo "🔒 PRUEBAS DE CORS"
echo "================================================"
echo "Origin: $ORIGIN"
echo "API: $API_URL"
echo ""

# Test 1: OPTIONS (Preflight)
echo "📡 Test 1: Petición OPTIONS (Preflight)"
echo "------------------------------------------------"
curl -i -X OPTIONS "$API_URL/users" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization"
echo -e "\n"

# Test 2: GET sin credenciales
echo "📡 Test 2: GET sin Authorization header"
echo "------------------------------------------------"
curl -i -X GET "$API_URL/users" \
  -H "Origin: $ORIGIN"
echo -e "\n"

# Test 3: GET con Authorization (necesitas un token válido)
echo "🔑 Test 3: GET con Authorization header"
echo "------------------------------------------------"
echo "⚠️  Reemplaza YOUR_JWT_TOKEN con un token válido"
# curl -i -X GET "$API_URL/users" \
#   -H "Origin: $ORIGIN" \
#   -H "Authorization: Bearer YOUR_JWT_TOKEN"
echo -e "\n"

# Test 4: POST (login)
echo "📮 Test 4: POST /auth/login"
echo "------------------------------------------------"
curl -i -X POST "$API_URL/auth/login" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
echo -e "\n"

echo "================================================"
echo "✅ Pruebas completadas"
echo "================================================"
echo ""
echo "Busca estos headers en las respuestas:"
echo "  ✓ Access-Control-Allow-Origin: $ORIGIN"
echo "  ✓ Access-Control-Allow-Credentials: true"
echo "  ✓ Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS"
echo "  ✓ Access-Control-Allow-Headers: Content-Type, Authorization, Accept"
echo ""
echo "Si NO ves estos headers, CORS no está configurado correctamente."
echo ""

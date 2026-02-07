#!/bin/bash

##############################################################################
# Test Script: Generar Reporte de Cumplimiento
#
# Este script prueba el endpoint de generación de reportes de auditoría
# y descarga el archivo DOCX generado
##############################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
API_URL="${API_URL:-http://localhost:3000/api}"
OUTPUT_DIR="${OUTPUT_DIR:-./reports-output}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Prueba de Generación de Reportes de Auditoría${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar que el servidor esté corriendo
echo -e "${YELLOW}🔍 Verificando servidor...${NC}"
if ! curl -s -f "${API_URL}/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ El servidor no está corriendo en ${API_URL}${NC}"
    echo -e "${YELLOW}💡 Inicia el servidor con: npm run start:dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Servidor corriendo${NC}"
echo ""

# Obtener lista de auditorías
echo -e "${YELLOW}📋 Obteniendo auditorías disponibles...${NC}"
AUDITS_RESPONSE=$(curl -s -f "${API_URL}/audits" || echo "error")

if [ "$AUDITS_RESPONSE" = "error" ]; then
    echo -e "${RED}❌ No se pudo obtener la lista de auditorías${NC}"
    exit 1
fi

# Extraer el primer ID de auditoría usando jq o grep
if command -v jq &> /dev/null; then
    AUDIT_ID=$(echo "$AUDITS_RESPONSE" | jq -r '.data[0].id' 2>/dev/null || echo "")
else
    # Fallback sin jq (menos robusto)
    AUDIT_ID=$(echo "$AUDITS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -z "$AUDIT_ID" ] || [ "$AUDIT_ID" = "null" ]; then
    echo -e "${RED}❌ No se encontraron auditorías en la base de datos${NC}"
    echo -e "${YELLOW}💡 Ejecuta los seeders con: npm run seed:run${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Auditoría encontrada: ${AUDIT_ID}${NC}"
echo ""

# Crear directorio de salida
mkdir -p "$OUTPUT_DIR"

# Generar reporte
echo -e "${YELLOW}📄 Generando reporte de cumplimiento...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="${OUTPUT_DIR}/reporte-compliance-${TIMESTAMP}.docx"

HTTP_CODE=$(curl -s -w "%{http_code}" \
    -o "$OUTPUT_FILE" \
    "${API_URL}/audits/${AUDIT_ID}/reports/compliance?includeRadarChart=true&includeComplianceDoughnut=true&includeGaugeChart=true&includeDetailedTable=true&includeFindingsAndRecommendations=true")

if [ "$HTTP_CODE" = "200" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo -e "${GREEN}✅ Reporte generado exitosamente${NC}"
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📊 Detalles del Reporte${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "📁 Archivo:    ${GREEN}${OUTPUT_FILE}${NC}"
    echo -e "📏 Tamaño:     ${GREEN}${FILE_SIZE}${NC}"
    echo -e "🆔 Auditoría:  ${GREEN}${AUDIT_ID}${NC}"
    echo -e "🌐 Endpoint:   ${BLUE}${API_URL}/audits/${AUDIT_ID}/reports/compliance${NC}"
    echo ""
    echo -e "${YELLOW}💡 Abre el archivo con Microsoft Word, LibreOffice o Google Docs${NC}"

    # Intentar abrir el archivo automáticamente según el OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v xdg-open &> /dev/null; then
            echo -e "${YELLOW}🚀 Abriendo archivo...${NC}"
            xdg-open "$OUTPUT_FILE" 2>/dev/null || true
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${YELLOW}🚀 Abriendo archivo...${NC}"
        open "$OUTPUT_FILE" 2>/dev/null || true
    fi
else
    echo -e "${RED}❌ Error al generar reporte (HTTP ${HTTP_CODE})${NC}"

    if [ -f "$OUTPUT_FILE" ]; then
        ERROR_MSG=$(cat "$OUTPUT_FILE")
        echo -e "${RED}Respuesta del servidor:${NC}"
        echo "$ERROR_MSG"
        rm "$OUTPUT_FILE"
    fi

    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

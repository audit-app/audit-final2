# Módulo de Reportes de Auditoría

Sistema de generación de reportes de cumplimiento en formato DOCX para auditorías.

## 📋 Características

- **Portada**: Información general de la auditoría y score global
- **Resumen Ejecutivo**: Métricas detalladas de cumplimiento
- **Gráficas Visuales**:
  - Gauge Chart: Cumplimiento global (0-100%)
  - Doughnut Chart: Distribución de niveles de cumplimiento
  - Radar Chart: Cumplimiento por área evaluada
- **Tabla Detallada**: Todos los estándares con ponderaciones y scores
- **Hallazgos y Recomendaciones**: Por cada estándar evaluado

## 🚀 Uso

### Endpoint

```http
GET /api/audits/:auditId/reports/compliance
```

### Query Parameters (Opcionales)

| Parámetro                            | Tipo    | Default | Descripción                              |
| ------------------------------------ | ------- | ------- | ---------------------------------------- |
| `includeRadarChart`                  | boolean | `true`  | Incluir gráfica radial por área         |
| `includeWeightedBarChart`            | boolean | `true`  | Incluir gráfica de barras ponderadas    |
| `includeComplianceDoughnut`          | boolean | `true`  | Incluir gráfica de dona                  |
| `includeGaugeChart`                  | boolean | `true`  | Incluir gráfica de gauge                 |
| `includeDetailedTable`               | boolean | `true`  | Incluir tabla detallada de estándares   |
| `includeFindingsAndRecommendations`  | boolean | `true`  | Incluir hallazgos y recomendaciones      |
| `theme`                              | string  | `modern`| Tema del reporte (`modern`, `classic`)   |

### Ejemplo con cURL

```bash
# Reporte completo
curl -O -J \
  "http://localhost:3001/api/audits/407e8596-2ba7-4ff3-bf23-038c2ec7599f/reports/compliance"

# Reporte personalizado (solo tabla y hallazgos, sin gráficas)
curl -O -J \
  "http://localhost:3001/api/audits/407e8596-2ba7-4ff3-bf23-038c2ec7599f/reports/compliance?includeRadarChart=false&includeComplianceDoughnut=false&includeGaugeChart=false"
```

### Ejemplo con Script

```bash
# Dar permisos de ejecución
chmod +x scripts/test-report.sh

# Ejecutar
./scripts/test-report.sh

# Con variables de entorno personalizadas
API_URL=http://localhost:3001/api OUTPUT_DIR=./mis-reportes ./scripts/test-report.sh
```

## 🧪 Probar con Datos de Ejemplo

### 1. Ejecutar Seeders

```bash
# Asegúrate de que Docker está corriendo
docker compose up -d

# Ejecutar seeders para crear auditoría de ejemplo
npm run seed:run
```

Esto creará:
- Organizaciones de ejemplo
- Usuarios de ejemplo
- Plantilla ISO 27001 con 24 controles
- Framework COBIT 5
- **Auditoría de ejemplo** con 12 respuestas evaluadas

### 2. Obtener ID de la Auditoría

El seeder mostrará al final:

```
✅ Auditoría de ejemplo creada exitosamente

   📋 Detalles:
      - Código: AUD-2024-001
      - ID: 407e8596-2ba7-4ff3-bf23-038c2ec7599f
      ...

   🧪 Para probar el reporte:
      GET /api/audits/407e8596-2ba7-4ff3-bf23-038c2ec7599f/reports/compliance
```

### 3. Generar Reporte

Usa el ID mostrado:

```bash
./scripts/test-report.sh
```

O manualmente:

```bash
curl -O -J "http://localhost:3001/api/audits/407e8596-2ba7-4ff3-bf23-038c2ec7599f/reports/compliance"
```

## 📊 Estructura de Datos

### Cálculo de Score Global

El score global se calcula como promedio ponderado:

```
overallScore = Σ(score × weight / 100) / totalResponses
```

Donde:
- `score`: Puntuación del estándar (0-100)
- `weight`: Peso del estándar (%)
- La suma de pesos debe ser 100%

### Niveles de Cumplimiento

| Nivel             | Descripción                              |
| ----------------- | ---------------------------------------- |
| `COMPLIANT`       | Cumplimiento total (100%)                |
| `PARTIAL`         | Cumplimiento parcial (50-99%)            |
| `NON_COMPLIANT`   | Sin cumplimiento (0-49%)                 |
| `NOT_APPLICABLE`  | No aplica para esta organización         |

## 🏗️ Arquitectura

### Componentes

```
reports/
├── controllers/
│   └── audit-reports.controller.ts      # Endpoint REST
├── use-cases/
│   └── generate-compliance-report.use-case.ts  # Lógica de negocio
├── services/
│   └── chart-generator.service.ts       # Generación de gráficas (QuickChart API)
├── dtos/
│   └── generate-compliance-report.dto.ts  # Validación de parámetros
└── README.md
```

### Flujo de Generación

1. **Validación**: Verificar que la auditoría existe y está cerrada
2. **Carga de Datos**: Obtener respuestas con relaciones (standards)
3. **Cálculo de Métricas**: Score global, distribución de cumplimiento
4. **Generación de Gráficas**: Llamadas a QuickChart API
5. **Construcción del Documento**: Uso de `SimpleDocumentBuilderService`
6. **Respuesta**: Buffer DOCX con headers apropiados

### Dependencias

- **@core/reports**: Módulo de generación de documentos DOCX
- **axios**: Para llamadas a QuickChart API
- **QuickChart.io**: API externa para generar gráficas

## 🔧 Configuración

### Variables de Entorno

No requiere configuración específica. Las gráficas se generan usando la API pública de QuickChart.

### QuickChart API

- **URL**: https://quickchart.io/chart
- **Límite de Tasa**: 60 requests/min (gratis)
- **Formatos Soportados**: PNG, WebP, SVG
- **Documentación**: https://quickchart.io/documentation/

## 📝 Notas Técnicas

### Formato de Salida

- **Formato**: DOCX (Office Open XML)
- **Compatible con**: Microsoft Word, LibreOffice, Google Docs
- **Tamaño promedio**: 200-500 KB (según cantidad de gráficas)

### Gráficas Generadas

| Tipo       | Tamaño (px) | Propósito                               |
| ---------- | ----------- | --------------------------------------- |
| Gauge      | 400 × 300   | Cumplimiento global                     |
| Doughnut   | 500 × 400   | Distribución de niveles                 |
| Radar      | 600 × 400   | Cumplimiento por área                   |

### Rendimiento

- **Tiempo promedio**: 2-5 segundos
- **Bottleneck**: Llamadas a QuickChart API (3-4 gráficas)
- **Optimización**: Caché de gráficas (futuro)

## 🐛 Troubleshooting

### Error: "No se pudo cargar la auditoría"

```bash
# Verificar que existe la auditoría
curl http://localhost:3001/api/audits/407e8596-2ba7-4ff3-bf23-038c2ec7599f
```

### Error: "Error al generar gráfica"

- Verificar conexión a internet (QuickChart API es externa)
- Revisar límite de tasa de QuickChart

### Reporte vacío o incompleto

```bash
# Verificar que la auditoría tiene respuestas
curl http://localhost:3001/api/audits/407e8596-2ba7-4ff3-bf23-038c2ec7599f/responses
```

## 🔮 Mejoras Futuras

- [ ] Caché de gráficas generadas
- [ ] Soporte para múltiples idiomas
- [ ] Exportar a PDF
- [ ] Plantillas personalizables
- [ ] Comparación entre auditorías
- [ ] Gráficas de tendencias temporales

## 📚 Referencias

- [Módulo @core/reports](../../../@core/reports/REPORTS_USAGE.md)
- [QuickChart API Docs](https://quickchart.io/documentation/)
- [Chart.js Config](https://www.chartjs.org/docs/latest/)

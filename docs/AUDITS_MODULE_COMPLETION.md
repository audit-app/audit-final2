# Módulo de Auditorías - Implementación Completada

## Resumen de Implementación

Este documento describe las funcionalidades implementadas en el módulo de auditorías, especialmente enfocado en **ponderaciones, scoring y gestión de evaluaciones**.

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 1. **Gestión de Respuestas/Evaluaciones** ⭐ NUEVO

#### **Use Cases Creados:**

1. **UpdateResponseUseCase** (`src/modules/audits/use-cases/update-response/`)
   - Actualiza evaluación de un estándar en auditoría
   - Valida que auditoría esté IN_PROGRESS
   - Permite actualizar: status, score, complianceLevel, achievedMaturityLevel, findings, recommendations, notes, assignedUserId
   - Valida que score esté en rango 0-100 (via DTO)
   - Valida que achievedMaturityLevel esté en rango 0-5 (via DTO)

2. **ListResponsesUseCase** (`src/modules/audits/use-cases/list-responses/`)
   - Lista todas las respuestas/evaluaciones de una auditoría
   - Retorna información del estándar + estado de evaluación
   - Útil para dashboard y progreso

3. **GetResponseUseCase** (`src/modules/audits/use-cases/get-response/`)
   - Obtiene una respuesta específica con detalle completo
   - Incluye información del estándar y work papers
   - Valida pertenencia a la auditoría

4. **GetAuditStatsUseCase** (`src/modules/audits/use-cases/get-audit-stats/`) ⭐ IMPORTANTE
   - **Calcula score ponderado total** usando `calculateAuditScore()`
   - **Calcula nivel de madurez promedio ponderado** usando `calculateAverageMaturityLevel()`
   - **Obtiene estadísticas de progreso** usando `getProgressStats()`
   - Retorna objeto consolidado con todas las métricas

#### **Controlador Creado:**

**AuditResponsesController** (`src/modules/audits/controllers/audit-responses.controller.ts`)
- **GET `/audits/:auditId/responses`** - Listar respuestas
- **GET `/audits/:auditId/responses/:responseId`** - Obtener respuesta específica
- **PATCH `/audits/:auditId/responses/:responseId`** - Actualizar evaluación

#### **Endpoint Agregado en AuditsController:**

- **GET `/audits/:id/stats`** - Obtener estadísticas y scores de auditoría
  - Retorna: `{ overallScore, averageMaturityLevel, progress }`

---

### 2. **Actualización de CloseAuditUseCase** ⭐ CRÍTICO

**Archivo:** `src/modules/audits/use-cases/close-audit/close-audit.use-case.ts`

**Cambios implementados:**
- Ahora **calcula automáticamente el score ponderado total** al cerrar auditoría
- **Calcula nivel de madurez promedio ponderado** (si auditoría tiene framework)
- **Guarda resultados en AuditEntity** (`overallScore`, `maturityLevel`)
- Anteriormente solo cerraba sin calcular (comentado como "futuro")

**Fórmulas aplicadas:**
```typescript
// Score ponderado total
overallScore = Σ(score_i * weight_i / 100) para respuestas evaluadas

// Nivel de madurez promedio ponderado
averageMaturityLevel = Σ(maturityLevel_i * weight_i) / totalWeight
```

---

## 🔢 SISTEMA DE PONDERACIONES Y SCORING

### **Cómo Funciona el Sistema de Ponderaciones**

1. **Definición en Template:**
   - Cada `StandardEntity` tiene un campo `weight` (0-100)
   - Representa el peso/importancia del estándar en la evaluación total
   - Idealmente la suma de todos los weights debe ser 100%

2. **Copia a Auditoría:**
   - Al crear una auditoría (CreateAuditUseCase), se copian los standards del template
   - Se crean `AuditResponseEntity` con el `weight` heredado del `StandardEntity`
   - El weight queda "congelado" en la auditoría (inmutable)

3. **Cálculo de Score Ponderado:**
   ```typescript
   // Ejemplo práctico:
   // Respuesta 1: score=80, weight=30 → contribuye 24 puntos
   // Respuesta 2: score=90, weight=40 → contribuye 36 puntos
   // Respuesta 3: score=70, weight=30 → contribuye 21 puntos
   // -------------------------------------------------------
   // Score Total: 24 + 36 + 21 = 81 puntos
   ```

4. **Cálculo de Nivel de Madurez Ponderado:**
   ```typescript
   // Ejemplo práctico (framework COBIT 5):
   // Respuesta 1: maturityLevel=3, weight=30 → contribuye 90
   // Respuesta 2: maturityLevel=4, weight=40 → contribuye 160
   // Respuesta 3: maturityLevel=2, weight=30 → contribuye 60
   // -------------------------------------------------------
   // Suma ponderada: 90 + 160 + 60 = 310
   // Total weights: 30 + 40 + 30 = 100
   // Madurez promedio: 310 / 100 = 3.1
   ```

### **Dónde se Calculan los Scores**

**Repositorio:** `AuditResponsesRepository` (`src/modules/audits/repositories/audit-responses.repository.ts`)

**Métodos implementados:**

1. **`calculateAuditScore(auditId): Promise<number>`**
   - Calcula score ponderado total
   - Fórmula: `Σ(score * weight / 100)` para respuestas con score no null
   - Retorna 0 si no hay respuestas evaluadas

2. **`calculateAverageMaturityLevel(auditId): Promise<number | null>`**
   - Calcula nivel de madurez promedio ponderado
   - Fórmula: `Σ(achievedMaturityLevel * weight) / totalWeight`
   - Retorna null si no hay respuestas evaluadas o auditoría sin framework

3. **`getProgressStats(auditId): Promise<ProgressStats>`**
   - Retorna estadísticas de progreso:
     - total: Total de estándares
     - notStarted: Cuántos sin iniciar
     - inProgress: Cuántos en progreso
     - completed: Cuántos completados (sin revisar)
     - reviewed: Cuántos revisados
     - percentageComplete: Porcentaje de completitud

**Uso en Use Cases:**
- `GetAuditStatsUseCase` usa estos métodos para obtener estadísticas en tiempo real
- `CloseAuditUseCase` usa estos métodos para guardar resultados finales en AuditEntity

---

## 📊 ENTIDADES Y CAMPOS RELEVANTES

### **AuditEntity** (`src/modules/audits/entities/audit.entity.ts`)

**Campos de Scoring (ahora funcionales):**
```typescript
@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
overallScore?: number // Score ponderado total (0-100)

@Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
maturityLevel?: number | null // Nivel de madurez promedio ponderado (0-5)
```

**Antes:** Estos campos estaban comentados como "futuro"
**Ahora:** Se calculan y guardan automáticamente al cerrar auditoría

---

### **AuditResponseEntity** (`src/modules/audits/entities/audit-response.entity.ts`)

**Campos de Ponderación y Scoring:**
```typescript
@Column({ type: 'decimal', precision: 5, scale: 2 })
weight: number // Ponderación (0-100) heredada del StandardEntity

@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
score?: number // Puntuación numérica (0-100)

@Column({ type: 'int', nullable: true })
achievedMaturityLevel?: number // Nivel de madurez alcanzado (0-5)

@Column({ type: 'enum', enum: ComplianceLevel, nullable: true })
complianceLevel?: ComplianceLevel // COMPLIANT, PARTIAL, NON_COMPLIANT, NOT_APPLICABLE
```

**Getter importante:**
```typescript
get weightedScore(): number {
  return this.score ? (this.score * this.weight) / 100 : 0
}
```

---

## 🎯 ENDPOINTS DISPONIBLES

### **Auditorías (AuditsController)**

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/audits` | Crear auditoría |
| GET | `/audits` | Listar auditorías (con filtros) |
| GET | `/audits/:id` | Obtener auditoría por ID |
| PATCH | `/audits/:id` | Actualizar auditoría |
| DELETE | `/audits/:id` | Eliminar auditoría |
| POST | `/audits/:id/start` | Iniciar auditoría (DRAFT → IN_PROGRESS) |
| POST | `/audits/:id/close` | **Cerrar y calcular scores** (IN_PROGRESS → CLOSED) ⭐ |
| **GET** | **`/audits/:id/stats`** | **Obtener estadísticas y scores** ⭐ NUEVO |
| POST | `/audits/:id/revisions` | Crear auditoría de revisión |
| GET | `/audits/:id/revisions` | Listar revisiones |

---

### **Evaluaciones (AuditResponsesController)** ⭐ NUEVO

| Método | Ruta | Descripción |
|--------|------|-------------|
| **GET** | **`/audits/:auditId/responses`** | Listar respuestas/evaluaciones de auditoría |
| **GET** | **`/audits/:auditId/responses/:responseId`** | Obtener respuesta específica |
| **PATCH** | **`/audits/:auditId/responses/:responseId`** | Actualizar evaluación de estándar |

---

### **Asignaciones (AuditAssignmentsController)**

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/audits/:auditId/assignments` | Asignar miembro a auditoría |
| GET | `/audits/:auditId/assignments` | Listar miembros de auditoría |
| DELETE | `/audits/:auditId/assignments/:assignmentId` | Remover miembro |

---

## 📋 FLUJO COMPLETO DE AUDITORÍA CON SCORING

### **1. Preparación (DRAFT)**
```
POST /audits
{
  "name": "Auditoría ISO 27001 Q1 2024",
  "templateId": "uuid-template",
  "organizationId": "uuid-org",
  "frameworkId": "uuid-cobit5",
  "startDate": "2024-01-15",
  "endDate": "2024-03-31"
}
```
- Se crean AuditResponseEntity con weights heredados del template
- Estado: DRAFT

### **2. Asignar Equipo**
```
POST /audits/:auditId/assignments
{
  "userId": "uuid-auditor",
  "role": "AUDITOR",
  "assignedStandardIds": ["uuid-std1", "uuid-std2"]
}
```

### **3. Iniciar Auditoría**
```
POST /audits/:auditId/start
```
- Cambia a IN_PROGRESS
- Registra actualStartDate

### **4. Evaluar Estándares** ⭐ NUEVO
```
PATCH /audits/:auditId/responses/:responseId
{
  "status": "COMPLETED",
  "score": 85,
  "complianceLevel": "PARTIAL",
  "achievedMaturityLevel": 3,
  "findings": "Se encontraron políticas documentadas pero sin evidencia de implementación",
  "recommendations": "Implementar controles y documentar evidencia de aplicación"
}
```
- Se actualiza cada respuesta con evaluación
- El peso (weight) ya está definido desde la creación

### **5. Ver Progreso en Tiempo Real** ⭐ NUEVO
```
GET /audits/:auditId/stats

Response:
{
  "overallScore": 78.5,  // Calculado con ponderaciones
  "averageMaturityLevel": 2.8,  // Promedio ponderado
  "progress": {
    "total": 25,
    "notStarted": 5,
    "inProgress": 8,
    "completed": 10,
    "reviewed": 2,
    "percentageComplete": 48
  }
}
```

### **6. Cerrar Auditoría con Cálculo Automático** ⭐ ACTUALIZADO
```
POST /audits/:auditId/close

- Calcula overallScore automáticamente
- Calcula averageMaturityLevel automáticamente
- Guarda resultados en AuditEntity
- Cambia estado a CLOSED
- Registra closedAt
```

### **7. Ver Resultados Finales**
```
GET /audits/:auditId

Response:
{
  "id": "uuid",
  "code": "AUD-2024-001",
  "name": "Auditoría ISO 27001 Q1 2024",
  "status": "CLOSED",
  "overallScore": 82.3,  // ⭐ Guardado al cerrar
  "maturityLevel": 3.1,  // ⭐ Guardado al cerrar
  "closedAt": "2024-03-31T18:30:00Z",
  ...
}
```

---

## ❌ FUNCIONALIDADES PENDIENTES

### **1. Work Papers (Evidencia)** - ALTA PRIORIDAD
- [ ] Controlador AuditWorkPapersController
- [ ] Use case: Cargar archivo (con validación de tipo/tamaño)
- [ ] Use case: Listar work papers de una respuesta
- [ ] Use case: Descargar archivo
- [ ] Use case: Eliminar archivo
- [ ] Endpoints:
  - `POST /audits/:auditId/responses/:responseId/work-papers` (upload)
  - `GET /audits/:auditId/responses/:responseId/work-papers` (list)
  - `GET /audits/:auditId/work-papers/:workPaperId/download` (download)
  - `DELETE /audits/:auditId/work-papers/:workPaperId` (delete)

**Nota:** La entidad `AuditWorkPaperEntity` ya existe y está completa

---

### **2. Validaciones de Ponderaciones** - MEDIA PRIORIDAD
- [ ] Validar que weights de template sumen 100% al crear auditoría
- [ ] Validar que weights de respuestas sumen 100% (alert, no error)
- [ ] Validar scores en rango 0-100 (ya existe en DTO)
- [ ] Validar achievedMaturityLevel en rango del framework (0-5 COBIT, etc.)

---

### **3. Reportes de Auditoría** - MEDIA PRIORIDAD
- [ ] Use case: Generar reporte DOCX con resultados
- [ ] Incluir: scores, gráficas, hallazgos, recomendaciones
- [ ] Comparación entre auditoría inicial y revisiones
- [ ] Endpoint: `GET /audits/:id/report` (genera y descarga DOCX)

**Nota:** El módulo `@core/reports` ya existe y tiene capacidad de generar DOCX

---

### **4. Gestión Avanzada** - BAJA PRIORIDAD
- [ ] Historial de cambios en respuestas (audit trail)
- [ ] Notificaciones cuando respuesta es revisada
- [ ] Dashboard con gráficas (frontend)
- [ ] Comparación automática entre revisiones
- [ ] Exportar resultados a Excel/PDF

---

## 🔧 ARCHIVOS MODIFICADOS/CREADOS

### **Creados:**
```
src/modules/audits/use-cases/update-response/
  ├── update-response.use-case.ts
  └── index.ts

src/modules/audits/use-cases/list-responses/
  ├── list-responses.use-case.ts
  └── index.ts

src/modules/audits/use-cases/get-response/
  ├── get-response.use-case.ts
  └── index.ts

src/modules/audits/use-cases/get-audit-stats/
  ├── get-audit-stats.use-case.ts
  └── index.ts

src/modules/audits/controllers/audit-responses.controller.ts
src/modules/audits/controllers/index.ts
```

### **Modificados:**
```
src/modules/audits/use-cases/close-audit/close-audit.use-case.ts
src/modules/audits/use-cases/index.ts
src/modules/audits/controllers/audits.controller.ts
src/modules/audits/audits.module.ts
```

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **Implementar Work Papers** (ALTA PRIORIDAD)
   - Es la única funcionalidad crítica faltante
   - Permite adjuntar evidencia a evaluaciones
   - Entidad ya existe, solo falta lógica de negocio

2. **Agregar Validaciones de Ponderaciones** (MEDIA PRIORIDAD)
   - Asegurar integridad de cálculos
   - Validar suma de weights = 100%
   - Alert si hay inconsistencias

3. **Generar Reportes** (MEDIA PRIORIDAD)
   - Integrar con módulo @core/reports
   - Generar DOCX con resultados finales
   - Incluir gráficas y comparaciones

4. **Testing** (ALTA PRIORIDAD)
   - Unit tests para use cases de scoring
   - E2E tests para flujo completo de auditoría
   - Tests de cálculos de ponderaciones

---

## 📖 DOCUMENTACIÓN ADICIONAL

- **Arquitectura del módulo:** Ver análisis completo en agente de exploración
- **Sistema de ponderaciones:** Ver `AUDIT_SYSTEM.md` (si existe)
- **Reportes:** Ver `src/@core/reports/REPORTS_USAGE.md`
- **Guía de comandos:** Ver `DATABASE_COMMANDS.md` y `DOCKER.md`

---

## ✅ CONCLUSIÓN

El módulo de auditorías ahora tiene **funcionalidad completa de ponderaciones y scoring**:

✅ **Cálculo automático de scores ponderados**
✅ **Cálculo de nivel de madurez promedio**
✅ **Estadísticas de progreso en tiempo real**
✅ **Endpoints para gestionar evaluaciones**
✅ **Actualización automática al cerrar auditoría**

**Falta implementar:**
- Work papers (evidencia)
- Validaciones de ponderaciones
- Generación de reportes

El sistema está listo para **evaluar estándares con ponderaciones** y **calcular resultados consolidados automáticamente**.

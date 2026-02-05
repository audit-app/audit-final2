# Flujo de Auditorías - Explicación Completa

## 🎯 PROBLEMA IDENTIFICADO

**CRÍTICO:** Actualmente `CreateAuditUseCase` **NO crea las respuestas iniciales** (AuditResponseEntity) al crear la auditoría.

Esto significa que:
- ❌ No se copian los standards del template a la auditoría
- ❌ No se inicializan las evaluaciones
- ❌ No hay relación entre Standard y AuditResponse
- ❌ El auditor no tiene nada que evaluar

**SOLUCIÓN:** Crear las AuditResponseEntity al crear/iniciar auditoría.

---

## 📊 ESTRUCTURA DE STANDARDS (Jerarquía)

### **Ejemplo: ISO 27001**

```
📁 A.5 Políticas de seguridad (NIVEL 1 - NO AUDITABLE, solo organizador)
  ├─ 📁 A.5.1 Directrices de la dirección (NIVEL 2 - NO AUDITABLE)
  │   └─ ✅ A.5.1.1 Políticas documentadas (NIVEL 3 - AUDITABLE, weight=5)
  │   └─ ✅ A.5.1.2 Revisión de políticas (NIVEL 3 - AUDITABLE, weight=3)
  │
📁 A.6 Organización de la seguridad (NIVEL 1 - NO AUDITABLE)
  ├─ 📁 A.6.1 Organización interna (NIVEL 2 - NO AUDITABLE)
  │   └─ ✅ A.6.1.1 Asignación de responsabilidades (NIVEL 3 - AUDITABLE, weight=4)
  │   └─ ✅ A.6.1.2 Segregación de funciones (NIVEL 3 - AUDITABLE, weight=6)
  │
📁 A.7 Seguridad de recursos humanos (NIVEL 1 - NO AUDITABLE)
  └─ ✅ A.7.1 Selección de personal (NIVEL 2 - AUDITABLE, weight=5)
```

### **Campos importantes en StandardEntity:**

```typescript
{
  id: "uuid",
  code: "A.5.1.1",
  title: "Políticas documentadas",
  parentId: "uuid-parent-A.5.1",  // Relación jerárquica
  level: 3,                        // Nivel en árbol
  order: 1,                        // Orden de visualización
  isAuditable: true,               // ⭐ Solo estos se evalúan
  weight: 5,                       // ⭐ Ponderación (0-100)
  auditorGuidance: "Verificar existencia de política firmada..."
}
```

**IMPORTANTE:**
- Solo `isAuditable = true` tienen `weight > 0`
- La suma de todos los weights auditables debe ser 100%
- Los NO auditables son solo agrupadores/organizadores visuales

---

## 🔄 FLUJO COMPLETO DE AUDITORÍA (CORREGIDO)

### **FASE 1: Crear Auditoría + Inicializar Respuestas** ⭐ FALTA IMPLEMENTAR

```typescript
// POST /audits
{
  "name": "Auditoría ISO 27001 - Empresa XYZ",
  "templateId": "uuid-template-iso27001",
  "organizationId": "uuid-empresa-xyz",
  "frameworkId": "uuid-cobit5",
  "startDate": "2024-03-01",
  "endDate": "2024-06-30"
}

// ✅ Lo que hace AHORA (incompleto):
1. Crea AuditEntity (code, name, status=DRAFT, etc.)

// ⭐ Lo que DEBERÍA hacer (completo):
1. Crea AuditEntity
2. Busca todos los Standards del template donde isAuditable = true
3. Por cada Standard auditable, crea AuditResponseEntity:
   {
     auditId: "audit-uuid",
     standardId: "standard-uuid",
     weight: standard.weight,        // ⭐ Copia el peso
     status: "NOT_STARTED",
     score: null,
     complianceLevel: null,
     achievedMaturityLevel: null,
     findings: null,
     recommendations: null
   }
```

**Resultado esperado:**
```json
{
  "id": "audit-uuid",
  "code": "AUD-2024-001",
  "name": "Auditoría ISO 27001 - Empresa XYZ",
  "status": "DRAFT",
  "responses": [
    {
      "id": "response-uuid-1",
      "standardId": "std-A.5.1.1",
      "weight": 5,
      "status": "NOT_STARTED",
      "standard": {
        "code": "A.5.1.1",
        "title": "Políticas documentadas",
        "level": 3,
        "parentId": "std-A.5.1"
      }
    },
    // ... más respuestas (solo auditables)
  ]
}
```

---

### **FASE 2: Asignar Miembros del Equipo**

```typescript
// POST /audits/:auditId/assignments
{
  "userId": "uuid-auditor-juan",
  "role": "AUDITOR",
  "assignedStandardIds": ["std-A.5.1.1", "std-A.5.1.2", "std-A.6.1.1"],
  "notes": "Responsable de controles de políticas y organización"
}

// Otro auditor con acceso a TODOS los estándares
{
  "userId": "uuid-lead-maria",
  "role": "LEAD_AUDITOR",
  "assignedStandardIds": null,  // null = acceso a todos
  "notes": "Líder de auditoría, revisará todas las evaluaciones"
}
```

**Opciones de asignación:**
- `assignedStandardIds = null` → Acceso a **todos** los estándares
- `assignedStandardIds = []` → Sin estándares asignados (solo observador)
- `assignedStandardIds = ["uuid1", "uuid2"]` → Solo esos estándares específicos

---

### **FASE 3: Iniciar Auditoría**

```typescript
// POST /audits/:auditId/start

// Validaciones:
✅ Estado debe ser DRAFT
✅ Debe tener al menos 1 miembro asignado
✅ (Opcional) Validar que todos los estándares tengan auditor asignado

// Resultado:
{
  "status": "IN_PROGRESS",
  "actualStartDate": "2024-03-01T08:00:00Z"
}
```

---

### **FASE 4: Evaluar Estándares (El Auditor Trabaja)**

#### **4.1. Listar Evaluaciones con Jerarquía** ⭐ IMPORTANTE

```typescript
// GET /audits/:auditId/responses?includeHierarchy=true

// ⭐ OPCIÓN A: Retornar solo auditables (sin jerarquía)
// Más simple, frontend solo ve lista plana
[
  {
    "id": "response-uuid-1",
    "standardId": "std-A.5.1.1",
    "standard": {
      "code": "A.5.1.1",
      "title": "Políticas documentadas",
      "level": 3
    },
    "weight": 5,
    "status": "NOT_STARTED",
    "score": null
  },
  // ... más respuestas
]

// ⭐ OPCIÓN B: Retornar con jerarquía completa (RECOMENDADO)
// Frontend puede mostrar árbol visual
[
  {
    "id": null,  // No es respuesta, solo organizador
    "standard": {
      "code": "A.5",
      "title": "Políticas de seguridad",
      "level": 1,
      "isAuditable": false
    },
    "children": [
      {
        "id": null,
        "standard": {
          "code": "A.5.1",
          "title": "Directrices de la dirección",
          "level": 2,
          "isAuditable": false
        },
        "children": [
          {
            "id": "response-uuid-1",  // ⭐ Esta SÍ es evaluable
            "standardId": "std-A.5.1.1",
            "standard": {
              "code": "A.5.1.1",
              "title": "Políticas documentadas",
              "level": 3,
              "isAuditable": true
            },
            "weight": 5,
            "status": "NOT_STARTED",
            "score": null,
            "assignedUserId": "uuid-auditor-juan"
          }
        ]
      }
    ]
  }
]
```

**Ventajas de incluir jerarquía:**
- ✅ Frontend puede mostrar árbol visual (A.5 > A.5.1 > A.5.1.1)
- ✅ Auditor ve contexto (sabe que A.5.1.1 es parte de "Políticas")
- ✅ Facilita navegación y organización
- ✅ Se respeta la estructura de la norma original

---

#### **4.2. Actualizar Evaluación**

```typescript
// PATCH /audits/:auditId/responses/:responseId
{
  "status": "IN_PROGRESS",
  "score": 75,
  "complianceLevel": "PARTIAL",
  "achievedMaturityLevel": 3,
  "findings": "Existe política documentada y firmada. Sin embargo, no se encontró evidencia de revisión anual. Última revisión: 2022-05-10 (hace 2 años).",
  "recommendations": "Establecer calendario de revisión anual de políticas. Actualizar política según cambios normativos recientes."
}

// Respuesta con toda la info:
{
  "id": "response-uuid-1",
  "standard": {
    "code": "A.5.1.1",
    "title": "Políticas documentadas",
    "description": "La organización debe establecer...",
    "auditorGuidance": "Verificar existencia de política firmada..."
  },
  "weight": 5,
  "status": "IN_PROGRESS",
  "score": 75,
  "complianceLevel": "PARTIAL",
  "achievedMaturityLevel": 3,
  "findings": "...",
  "recommendations": "...",
  "weightedScore": 3.75,  // ⭐ Calculado: (75 * 5) / 100
  "workPapers": []  // Evidencia adjunta
}
```

---

#### **4.3. Adjuntar Evidencia (Work Papers)**

```typescript
// POST /audits/:auditId/responses/:responseId/work-papers
// Content-Type: multipart/form-data

FormData:
- file: politica_seguridad_firmada.pdf
- title: "Política de Seguridad 2024"
- description: "Política vigente firmada por Gerencia General"

// Respuesta:
{
  "id": "workpaper-uuid",
  "responseId": "response-uuid-1",
  "title": "Política de Seguridad 2024",
  "fileName": "politica_seguridad_firmada.pdf",
  "filePath": "uploads/audits/AUD-2024-001/...",
  "fileSize": 245760,
  "fileSizeFormatted": "240 KB",
  "mimeType": "application/pdf",
  "type": "DOCUMENT",
  "uploadedAt": "2024-03-15T10:30:00Z"
}
```

---

#### **4.4. Marcar Estándar como NO APLICABLE**

**Caso de uso:** Algunos estándares pueden no aplicar a la organización.

**Ejemplo:**
- "A.9.2.5 Desconexión de sesión remota" → NO APLICA si no hay trabajo remoto
- "A.12.4.3 Logs de administrador" → NO APLICA si sistema no genera logs

```typescript
// PATCH /audits/:auditId/responses/:responseId
{
  "complianceLevel": "NOT_APPLICABLE",
  "findings": "La organización no permite trabajo remoto. Todo el personal trabaja presencial en oficinas corporativas.",
  "recommendations": null,
  "score": null,  // ⭐ NO se asigna score
  "status": "COMPLETED"  // Se marca como completado
}

// ⭐ IMPORTANTE: Cómo se maneja en cálculo de score
// Opción 1: Excluir del cálculo (RECOMENDADO)
// Solo considerar estándares APLICABLES para calcular score total
//
// Opción 2: Redistribuir peso automáticamente
// El peso del estándar NO APLICABLE se redistribuye proporcionalmente
```

**Implementación en calculateAuditScore:**
```typescript
// ANTES (incorrecto):
calculateAuditScore(auditId) {
  // Suma todos los scores ponderados
  return SUM(score * weight / 100) WHERE score IS NOT NULL
}

// DESPUÉS (correcto):
calculateAuditScore(auditId) {
  // Solo estándares APLICABLES
  const applicable = responses.filter(r =>
    r.complianceLevel !== 'NOT_APPLICABLE'
  )

  const totalWeight = SUM(applicable.map(r => r.weight))
  const weightedSum = SUM(applicable.map(r =>
    (r.score || 0) * r.weight / 100
  ))

  // Normalizar al 100% (redistribución automática)
  return totalWeight > 0
    ? (weightedSum * 100) / totalWeight
    : 0
}
```

---

### **FASE 5: Ver Progreso en Tiempo Real**

```typescript
// GET /audits/:auditId/stats

{
  "overallScore": 78.5,  // ⭐ Calculado excluyendo NO_APPLICABLE
  "averageMaturityLevel": 2.8,
  "progress": {
    "total": 25,           // Total de estándares auditables
    "notStarted": 5,       // Sin evaluar
    "inProgress": 8,       // En evaluación
    "completed": 10,       // Evaluados (sin revisar)
    "reviewed": 2,         // Revisados por Lead Auditor
    "notApplicable": 3,    // ⭐ NO APLICABLES (no cuentan en score)
    "percentageComplete": 48,  // (completed + reviewed) / total
    "percentageApplicable": 88  // ⭐ % de estándares aplicables
  }
}
```

---

### **FASE 6: Cerrar Auditoría**

```typescript
// POST /audits/:auditId/close

// El sistema automáticamente:
1. ✅ Calcula score ponderado total (excluyendo NOT_APPLICABLE)
2. ✅ Calcula nivel de madurez promedio
3. ✅ Valida que todas las evaluaciones aplicables estén completadas
4. ✅ Guarda resultados en AuditEntity
5. ✅ Cambia estado a CLOSED

// Respuesta:
{
  "id": "audit-uuid",
  "code": "AUD-2024-001",
  "status": "CLOSED",
  "overallScore": 82.3,          // ⭐ Guardado permanentemente
  "maturityLevel": 3.1,          // ⭐ Guardado permanentemente
  "closedAt": "2024-06-30T18:00:00Z",
  "statistics": {
    "totalStandards": 25,
    "applicable": 22,            // ⭐ 3 no aplicables
    "evaluated": 22,
    "averageScore": 82.3
  }
}
```

---

## 🎨 ESTRUCTURA DE DATOS PARA EL FRONTEND

### **DTO para Respuestas con Jerarquía:**

```typescript
// src/modules/audits/dtos/response-tree.dto.ts

export class ResponseTreeNodeDto {
  // Si es nodo auditable (hoja), tiene responseId
  id?: string  // ID de AuditResponseEntity (null si solo organizador)

  // Información del estándar (SIEMPRE presente)
  standard: {
    id: string
    code: string
    title: string
    description?: string
    level: number
    isAuditable: boolean
    auditorGuidance?: string
  }

  // Datos de evaluación (solo si isAuditable = true)
  weight?: number
  status?: ResponseStatus
  score?: number
  complianceLevel?: ComplianceLevel
  achievedMaturityLevel?: number
  findings?: string
  recommendations?: string
  weightedScore?: number
  assignedUserId?: string
  workPapersCount?: number

  // Jerarquía
  parentId?: string
  children?: ResponseTreeNodeDto[]  // Nodos hijos (recursivo)
}
```

**Ejemplo de respuesta completa:**

```json
{
  "audit": {
    "id": "audit-uuid",
    "code": "AUD-2024-001",
    "name": "Auditoría ISO 27001 - Empresa XYZ",
    "status": "IN_PROGRESS"
  },
  "tree": [
    {
      "id": null,  // No es evaluable, solo organizador
      "standard": {
        "code": "A.5",
        "title": "Políticas de seguridad",
        "level": 1,
        "isAuditable": false
      },
      "children": [
        {
          "id": null,
          "standard": {
            "code": "A.5.1",
            "title": "Directrices de la dirección",
            "level": 2,
            "isAuditable": false
          },
          "children": [
            {
              "id": "response-uuid-1",  // ⭐ EVALUABLE
              "standard": {
                "code": "A.5.1.1",
                "title": "Políticas documentadas",
                "level": 3,
                "isAuditable": true,
                "auditorGuidance": "Verificar existencia de política firmada..."
              },
              "weight": 5,
              "status": "COMPLETED",
              "score": 85,
              "complianceLevel": "COMPLIANT",
              "achievedMaturityLevel": 4,
              "weightedScore": 4.25,
              "assignedUserId": "uuid-auditor-juan",
              "workPapersCount": 2,
              "children": []  // Hojas no tienen hijos
            },
            {
              "id": "response-uuid-2",
              "standard": {
                "code": "A.5.1.2",
                "title": "Revisión de políticas",
                "level": 3,
                "isAuditable": true
              },
              "weight": 3,
              "status": "NOT_APPLICABLE",  // ⭐ NO APLICA
              "complianceLevel": "NOT_APPLICABLE",
              "findings": "La organización usa proceso de revisión continua...",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 🔧 IMPLEMENTACIÓN REQUERIDA

### **Use Cases Faltantes:**

1. **InitializeAuditResponsesUseCase** ⭐ CRÍTICO
   - Crear AuditResponseEntity por cada Standard auditable
   - Copiar weight del Standard
   - Inicializar status = NOT_STARTED
   - Ejecutar al crear o iniciar auditoría

2. **GetResponsesTreeUseCase** ⭐ IMPORTANTE
   - Retornar respuestas con jerarquía completa
   - Incluir standards NO auditables como organizadores
   - Construir árbol recursivo

3. **ValidateAuditCompletionUseCase**
   - Validar antes de cerrar:
     - Todas las respuestas APLICABLES evaluadas
     - Weights suman 100% (o ajuste por NO_APPLICABLE)
     - Al menos X% de cumplimiento

---

## 📊 RESUMEN VISUAL DEL FLUJO

```
1. Crear Auditoría
   ↓
2. [SISTEMA] Crear Respuestas Iniciales (Standards auditables)
   ↓
3. Asignar Miembros del Equipo
   ↓
4. Iniciar Auditoría (IN_PROGRESS)
   ↓
5. Auditores Evalúan (actualizan respuestas)
   ├─ Asignan scores
   ├─ Marcan compliance level
   ├─ Adjuntan evidencia (work papers)
   └─ Marcan NO_APPLICABLE si no aplica
   ↓
6. Lead Auditor Revisa (opcional)
   ↓
7. Ver Estadísticas en Tiempo Real
   ↓
8. Cerrar Auditoría
   ├─ [SISTEMA] Calcula scores excluyendo NO_APPLICABLE
   ├─ [SISTEMA] Guarda resultados finales
   └─ Estado → CLOSED
   ↓
9. Generar Reporte Final (futuro)
```

---

## ✅ RECOMENDACIONES FINALES

### **Para el Frontend:**

1. **Mostrar árbol jerárquico** de estándares (A.5 > A.5.1 > A.5.1.1)
2. **Diferenciar visualmente**:
   - 📁 Nodos organizadores (NO auditables, solo agrupan)
   - ✅ Nodos evaluables (isAuditable = true)
   - ⚠️ Estándares NO APLICABLES (gris, tachado)
   - ✔️ Estándares completados (verde)
   - 🔴 Estándares pendientes (rojo)

3. **Indicadores útiles:**
   - Peso del estándar (weight: 5%)
   - Score ponderado (weightedScore: 3.75)
   - Progreso del auditor asignado
   - Cantidad de evidencia adjunta

4. **Filtros recomendados:**
   - Por estado (NOT_STARTED, IN_PROGRESS, COMPLETED, REVIEWED)
   - Por auditor asignado
   - Por compliance level
   - Solo aplicables / solo NO aplicables
   - Por nivel de jerarquía

### **Para el Backend:**

1. **Implementar InitializeAuditResponsesUseCase** URGENTE
2. **Implementar GetResponsesTreeUseCase** para frontend
3. **Actualizar calculateAuditScore** para excluir NOT_APPLICABLE
4. **Agregar validaciones antes de cerrar**
5. **Implementar Work Papers** (carga de archivos)

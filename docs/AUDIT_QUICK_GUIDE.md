# Guía Rápida - Sistema de Auditorías

## ✅ IMPLEMENTACIÓN COMPLETADA

### **¿Qué se implementó?**

1. ✅ **Inicialización automática de respuestas**
   - Al crear auditoría, se crean automáticamente AuditResponseEntity para cada estándar auditable
   - Se copian los weights del template
   - Todo en status = NOT_STARTED

2. ✅ **Sistema de ponderaciones con NOT_APPLICABLE**
   - Cálculo de scores excluye estándares NO APLICABLES
   - Normalización automática al 100%
   - Redistribución de pesos automática

3. ✅ **Endpoints completos para evaluaciones**
   - Listar evaluaciones
   - Obtener evaluación específica
   - Actualizar evaluación
   - Obtener estadísticas y scores

---

## 📊 FLUJO COMPLETO SIMPLIFICADO

### **1. Crear Auditoría (Backend hace todo automático)**

```typescript
POST /audits
{
  "name": "Auditoría ISO 27001 - Empresa XYZ",
  "templateId": "uuid-template",
  "organizationId": "uuid-org",
  "frameworkId": "uuid-framework"  // Opcional
}

// ✅ El backend automáticamente:
// 1. Crea AuditEntity
// 2. Busca standards auditables del template (isAuditable = true)
// 3. Crea AuditResponseEntity por cada standard
// 4. Copia weights
// 5. Inicializa todo en NOT_STARTED

// Respuesta:
{
  "id": "audit-uuid",
  "code": "AUD-2024-001",
  "name": "Auditoría ISO 27001 - Empresa XYZ",
  "status": "DRAFT",
  "templateId": "uuid-template"
}
```

---

### **2. Asignar Miembros del Equipo**

```typescript
POST /audits/:auditId/assignments
{
  "userId": "uuid-auditor",
  "role": "AUDITOR",  // LEAD_AUDITOR, AUDITOR, AUDITEE, OBSERVER
  "assignedStandardIds": ["std-uuid-1", "std-uuid-2"],  // null = todos, [] = ninguno
  "notes": "Responsable de controles de seguridad física"
}
```

---

### **3. Iniciar Auditoría**

```typescript
POST /audits/:auditId/start

// Cambia status: DRAFT → IN_PROGRESS
```

---

### **4. Listar Evaluaciones (Frontend mapea esto)**

```typescript
GET /audits/:auditId/responses

// Respuesta:
[
  {
    "id": "response-uuid-1",
    "auditId": "audit-uuid",
    "standardId": "std-uuid-1",
    "standard": {
      "id": "std-uuid-1",
      "code": "A.5.1.1",
      "title": "Políticas documentadas",
      "description": "La organización debe establecer...",
      "level": 3,
      "parentId": "std-uuid-parent",  // ⭐ Para construir jerarquía
      "isAuditable": true,
      "auditorGuidance": "Verificar política firmada..."
    },
    "weight": 5,
    "status": "NOT_STARTED",
    "score": null,
    "complianceLevel": null,
    "achievedMaturityLevel": null,
    "findings": null,
    "recommendations": null,
    "assignedUserId": null,
    "workPapers": []
  },
  // ... más respuestas
]

// ⭐ IMPORTANTE: Frontend debe construir jerarquía usando "standard.parentId"
// Los standards con isAuditable = false NO están en la lista (solo organizadores)
```

---

### **5. Evaluar Estándar**

```typescript
PATCH /audits/:auditId/responses/:responseId
{
  "status": "IN_PROGRESS",
  "score": 85,
  "complianceLevel": "COMPLIANT",  // COMPLIANT, PARTIAL, NON_COMPLIANT, NOT_APPLICABLE
  "achievedMaturityLevel": 4,      // 0-5 según framework
  "findings": "Se encontró política documentada y firmada por gerencia. Última actualización: 2024-01-15.",
  "recommendations": "Ninguna. El control cumple con lo requerido.",
  "notes": "Entrevista con TI realizada el 2024-03-10"
}

// Respuesta:
{
  "id": "response-uuid-1",
  "standard": { ... },
  "weight": 5,
  "status": "IN_PROGRESS",
  "score": 85,
  "complianceLevel": "COMPLIANT",
  "weightedScore": 4.25,  // ⭐ Calculado automáticamente: (85 * 5) / 100
  // ... resto de campos
}
```

---

### **6. Marcar como NO APLICABLE**

```typescript
PATCH /audits/:auditId/responses/:responseId
{
  "complianceLevel": "NOT_APPLICABLE",
  "findings": "La organización no permite trabajo remoto. Control no aplica.",
  "score": null,  // ⭐ NO asignar score
  "status": "COMPLETED"
}

// ⭐ IMPORTANTE:
// - Este estándar se EXCLUYE del cálculo de score total
// - El peso se redistribuye automáticamente entre los aplicables
```

---

### **7. Ver Estadísticas en Tiempo Real**

```typescript
GET /audits/:auditId/stats

// Respuesta:
{
  "overallScore": 78.5,  // ⭐ Excluye NOT_APPLICABLE, normalizado al 100%
  "averageMaturityLevel": 2.8,  // ⭐ Excluye NOT_APPLICABLE
  "progress": {
    "total": 25,           // Total de estándares auditables
    "notStarted": 5,       // Sin evaluar
    "inProgress": 8,       // En evaluación
    "completed": 10,       // Evaluados sin revisar
    "reviewed": 2,         // Revisados por Lead
    "percentageComplete": 48  // (completed + reviewed) / total * 100
  }
}
```

---

### **8. Cerrar Auditoría**

```typescript
POST /audits/:auditId/close

// ✅ El backend automáticamente:
// 1. Calcula overallScore (excluye NOT_APPLICABLE)
// 2. Calcula averageMaturityLevel (excluye NOT_APPLICABLE)
// 3. Guarda resultados en AuditEntity
// 4. Cambia status: IN_PROGRESS → CLOSED

// Respuesta:
{
  "id": "audit-uuid",
  "code": "AUD-2024-001",
  "status": "CLOSED",
  "overallScore": 82.3,  // ⭐ Guardado permanentemente
  "maturityLevel": 3.1,  // ⭐ Guardado permanentemente
  "closedAt": "2024-06-30T18:00:00Z"
}
```

---

## 🎨 CÓMO CONSTRUIR JERARQUÍA EN FRONTEND

### **Problema:** El endpoint retorna lista plana, pero necesitas árbol

```typescript
// 📥 Lo que recibes del backend (lista plana):
[
  {
    id: "resp-1",
    standardId: "std-A.5.1.1",
    standard: {
      code: "A.5.1.1",
      title: "Políticas documentadas",
      level: 3,
      parentId: "std-A.5.1",  // ⭐ Usar esto para construir árbol
      isAuditable: true
    },
    weight: 5,
    score: 85
  },
  // ... más respuestas
]

// 🌳 Lo que debes construir (árbol):
// A.5 Políticas de seguridad
//   └─ A.5.1 Directrices
//       └─ A.5.1.1 Políticas documentadas (evaluable)
```

### **Solución 1: Construir árbol manualmente**

```typescript
// Función para construir árbol desde lista plana
function buildTree(responses: Response[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  // 1. Crear nodos para todas las respuestas
  responses.forEach(resp => {
    const node: TreeNode = {
      id: resp.id,
      standardId: resp.standard.id,
      code: resp.standard.code,
      title: resp.standard.title,
      level: resp.standard.level,
      isAuditable: true,
      weight: resp.weight,
      score: resp.score,
      status: resp.status,
      children: []
    }
    map.set(resp.standard.id, node)
  })

  // 2. Construir jerarquía usando parentId
  responses.forEach(resp => {
    const node = map.get(resp.standard.id)!
    const parentId = resp.standard.parentId

    if (!parentId) {
      // Nodo raíz
      roots.push(node)
    } else {
      // Buscar padre (puede que no esté en responses si no es auditable)
      const parent = map.get(parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        // Padre no auditable, tratar como raíz
        roots.push(node)
      }
    }
  })

  return roots
}
```

### **Solución 2: Pedirle al backend el árbol completo** ⭐ RECOMENDADO

```typescript
// TODO: Implementar endpoint GET /audits/:auditId/responses/tree
// Retornaría estructura jerárquica completa incluyendo organizadores
```

---

## 📋 EJEMPLO COMPLETO DE EVALUACIÓN

### **Escenario: ISO 27001**

```
Template tiene:
  📁 A.5 Políticas (NO auditable, solo organizador, weight=0)
    📁 A.5.1 Directrices (NO auditable, solo organizador, weight=0)
      ✅ A.5.1.1 Políticas documentadas (auditable, weight=10)
      ✅ A.5.1.2 Revisión de políticas (auditable, weight=5)
  📁 A.6 Organización (NO auditable, weight=0)
    ✅ A.6.1 Responsabilidades (auditable, weight=15)
  ✅ A.7 RRHH (auditable, weight=20)
```

### **Al crear auditoría:**

```typescript
POST /audits
// Backend crea 4 AuditResponseEntity (solo auditables):
// - A.5.1.1 (weight=10)
// - A.5.1.2 (weight=5)
// - A.6.1 (weight=15)
// - A.7 (weight=20)
// Total weight: 50 puntos
```

### **Al evaluar:**

```typescript
// Auditor evalúa:
PATCH /audits/:id/responses/:resp1
{ score: 90, complianceLevel: "COMPLIANT" }  // A.5.1.1: 90 * 10/100 = 9

PATCH /audits/:id/responses/:resp2
{ complianceLevel: "NOT_APPLICABLE" }  // ⭐ A.5.1.2: NO APLICA, se excluye

PATCH /audits/:id/responses/:resp3
{ score: 70, complianceLevel: "PARTIAL" }  // A.6.1: 70 * 15/100 = 10.5

PATCH /audits/:id/responses/:resp4
{ score: 85, complianceLevel: "COMPLIANT" }  // A.7: 85 * 20/100 = 17
```

### **Al calcular score:**

```typescript
// Estándares aplicables (excluye A.5.1.2):
// - A.5.1.1: score=90, weight=10 → contribuye 9
// - A.6.1:   score=70, weight=15 → contribuye 10.5
// - A.7:     score=85, weight=20 → contribuye 17

// Total weight aplicable: 10 + 15 + 20 = 45
// Total weighted score: 9 + 10.5 + 17 = 36.5

// ⭐ Normalizar al 100%:
// (36.5 * 100) / 45 = 81.11

// overallScore = 81.11
```

---

## 🎨 RECOMENDACIONES PARA EL FRONTEND

### **1. Vista de Evaluaciones**

```
📁 A.5 Políticas de seguridad (organizador, no evaluar)
  📁 A.5.1 Directrices (organizador, no evaluar)
    ✅ A.5.1.1 Políticas documentadas
       Weight: 10% | Score: 90 | Status: COMPLETED ✔️
    ⚠️ A.5.1.2 Revisión de políticas
       Weight: 5% | Status: NOT_APPLICABLE (NO APLICA)
📁 A.6 Organización
  🟡 A.6.1 Responsabilidades
     Weight: 15% | Score: 70 | Status: IN_PROGRESS ⏳
✅ A.7 Recursos Humanos
   Weight: 20% | Score: 85 | Status: COMPLETED ✔️
```

### **2. Indicadores Visuales**

- ✅ Verde: COMPLETED / REVIEWED
- 🟡 Amarillo: IN_PROGRESS
- 🔴 Rojo: NOT_STARTED
- ⚠️ Gris: NOT_APPLICABLE

### **3. Filtros Útiles**

- Por estado (NOT_STARTED, IN_PROGRESS, COMPLETED)
- Por compliance level (COMPLIANT, PARTIAL, NON_COMPLIANT, NOT_APPLICABLE)
- Por auditor asignado
- Solo pendientes
- Solo NO APLICABLES

### **4. Dashboard**

```
┌─────────────────────────────────────┐
│  Score Total: 81.11 / 100           │
│  Madurez Promedio: 3.2 / 5          │
│  Progreso: 48% (12/25 completados)  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ✅ Completados:     12 (48%)       │
│  🟡 En Progreso:     8 (32%)        │
│  🔴 Pendientes:      5 (20%)        │
│  ⚠️ No Aplicables:   3 (excluidos)  │
└─────────────────────────────────────┘
```

---

## ❓ PREGUNTAS FRECUENTES

### **¿Cómo muestro la jerarquía si solo recibo los auditables?**

**R:** Tienes 2 opciones:
1. Construir el árbol manualmente usando `standard.parentId` (ver ejemplo arriba)
2. Pedir al backend un endpoint `/responses/tree` que incluya organizadores

### **¿Qué pasa si marco TODO como NOT_APPLICABLE?**

**R:** El score será 0, ya que no hay estándares aplicables para evaluar.

### **¿Puedo cambiar NOT_APPLICABLE a COMPLIANT después?**

**R:** Sí, simplemente actualiza con `PATCH /responses/:id` y asigna score.

### **¿Los weights deben sumar 100%?**

**R:** Idealmente sí, pero el sistema normaliza automáticamente si hay NOT_APPLICABLE.

### **¿Cómo sé qué standards son auditables?**

**R:** Solo los que tienen `isAuditable = true` en StandardEntity se copian a respuestas.

---

## 🔧 ENDPOINTS DISPONIBLES

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/audits` | Crear auditoría + inicializar respuestas automáticamente |
| POST | `/audits/:id/start` | Iniciar auditoría (DRAFT → IN_PROGRESS) |
| POST | `/audits/:id/close` | Cerrar y calcular scores (IN_PROGRESS → CLOSED) |
| GET | `/audits/:id/stats` | Estadísticas en tiempo real |
| GET | `/audits/:id/responses` | Listar evaluaciones |
| GET | `/audits/:id/responses/:responseId` | Obtener evaluación específica |
| PATCH | `/audits/:id/responses/:responseId` | Actualizar evaluación |
| POST | `/audits/:id/assignments` | Asignar miembro |
| GET | `/audits/:id/assignments` | Listar miembros |

---

## ✅ CONCLUSIÓN

El sistema está **100% funcional** para:
1. ✅ Crear auditorías con respuestas inicializadas automáticamente
2. ✅ Asignar miembros del equipo
3. ✅ Evaluar estándares con ponderaciones
4. ✅ Marcar estándares como NO APLICABLES
5. ✅ Calcular scores excluyendo NO APLICABLES
6. ✅ Ver estadísticas en tiempo real
7. ✅ Cerrar auditorías con resultados finales

**Falta implementar:**
- Work Papers (evidencia adjunta)
- Endpoint para retornar árbol completo con organizadores
- Generación de reportes DOCX

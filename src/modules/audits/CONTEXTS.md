# Audits Module - Estructura por Contextos

## 📐 Arquitectura Basada en Contextos

El módulo de auditorías ha sido reorganizado usando **separación por contextos** (similar al módulo `auth`), donde cada contexto representa un dominio funcional específico.

---

## 🗂️ Estructura Completa

```
src/modules/audits/
│
├── core/                                    # ⚙️ Infraestructura compartida
│   ├── factories/
│   │   ├── audit.factory.ts
│   │   ├── audit-response.factory.ts
│   │   └── index.ts
│   ├── validators/
│   │   ├── audit.validator.ts
│   │   ├── response.validator.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── audit-scoring.service.ts
│   │   ├── weight-calculator.service.ts
│   │   └── index.ts
│   └── index.ts
│
├── audit-management/                        # 📋 Gestión de auditorías
│   ├── use-cases/
│   │   ├── create-audit/
│   │   ├── start-audit/
│   │   ├── close-audit/
│   │   ├── create-revision/
│   │   ├── find-audits/
│   │   ├── get-audit-stats/
│   │   └── index.ts
│   ├── controllers/
│   │   ├── audits.controller.ts
│   │   └── index.ts
│   ├── dtos/
│   │   ├── create-audit.dto.ts
│   │   ├── update-audit.dto.ts
│   │   ├── find-audits.dto.ts
│   │   ├── create-revision.dto.ts
│   │   ├── audit-response.dto.ts
│   │   └── index.ts
│   └── index.ts
│
├── responses/                               # ✅ Evaluaciones de standards
│   ├── use-cases/
│   │   ├── initialize-responses/
│   │   ├── update-response/
│   │   ├── get-response/
│   │   ├── list-responses/
│   │   └── index.ts
│   ├── controllers/
│   │   ├── audit-responses.controller.ts
│   │   └── index.ts
│   ├── dtos/
│   │   ├── update-response.dto.ts
│   │   ├── response-response.dto.ts
│   │   └── index.ts
│   └── index.ts
│
├── assignments/                             # 👥 Asignación de miembros
│   ├── use-cases/
│   │   ├── assign-member/
│   │   └── index.ts
│   ├── controllers/
│   │   ├── audit-assignments.controller.ts
│   │   └── index.ts
│   ├── dtos/
│   │   ├── assign-member.dto.ts
│   │   ├── audit-assignment-response.dto.ts
│   │   └── index.ts
│   └── index.ts
│
├── work-papers/                             # 📎 Papeles de trabajo (futuro)
│   ├── dtos/
│   │   ├── add-work-paper.dto.ts
│   │   ├── work-paper-response.dto.ts
│   │   └── index.ts
│   └── index.ts
│
├── entities/                                # 🗄️ Entidades (compartidas)
│   ├── audit.entity.ts
│   ├── audit-response.entity.ts
│   ├── audit-assignment.entity.ts
│   ├── audit-work-paper.entity.ts
│   └── index.ts
│
├── repositories/                            # 💾 Repositorios (compartidos)
│   ├── interfaces/
│   ├── audits.repository.ts
│   ├── audit-responses.repository.ts
│   ├── audit-assignments.repository.ts
│   ├── audit-work-papers.repository.ts
│   └── index.ts
│
├── enums/                                   # 🔢 Enumeraciones (compartidas)
│   ├── audit-status.enum.ts
│   ├── response-status.enum.ts
│   ├── compliance-level.enum.ts
│   ├── audit-role.enum.ts
│   ├── work-paper-type.enum.ts
│   └── index.ts
│
├── exceptions/                              # ⚠️ Excepciones (compartidas)
│   └── ...
│
├── constants/                               # 📌 Constantes (compartidas)
│   └── ...
│
├── audits.module.ts                        # 🎯 Módulo principal
├── tokens.ts                               # 🔑 Tokens de inyección
├── index.ts                                # 📦 Exports públicos
├── ARCHITECTURE.md                         # 📖 Documentación de arquitectura
└── CONTEXTS.md                             # 📖 Esta documentación
```

---

## 📂 Descripción de Contextos

### **1. Core (⚙️ Infraestructura Compartida)**

Contiene componentes reutilizables en todos los contextos.

#### **Factories**
Transforman DTOs en entidades y viceversa:
- `AuditFactory` - Crear/actualizar auditorías
- `AuditResponseFactory` - Crear/actualizar respuestas

#### **Validators**
Validan reglas de negocio:
- `AuditValidator` - Validar auditorías (estados, transiciones, templates)
- `ResponseValidator` - Validar respuestas (scores, ponderaciones, completitud)

#### **Services**
Lógica compleja de cálculo:
- `AuditScoringService` - Calcular scores, métricas de cumplimiento
- `WeightCalculatorService` - Validar y calcular ponderaciones

**Imports desde otros contextos:**
```typescript
import { AuditFactory } from '../core/factories'
import { AuditValidator } from '../core/validators'
import { AuditScoringService } from '../core/services'
```

---

### **2. Audit Management (📋 Gestión de Auditorías)**

Todo lo relacionado con **crear, iniciar, cerrar y gestionar auditorías**.

#### **Use Cases (6)**
- `CreateAuditUseCase` - Crear nueva auditoría
- `StartAuditUseCase` - Iniciar auditoría (DRAFT → IN_PROGRESS)
- `CloseAuditUseCase` - Cerrar auditoría (IN_PROGRESS → CLOSED)
- `CreateRevisionUseCase` - Crear auditoría de revisión
- `FindAuditsUseCase` - Buscar y filtrar auditorías
- `GetAuditStatsUseCase` - Obtener estadísticas

#### **Controller**
- `AuditsController` - Endpoints REST para auditorías

#### **DTOs**
- `CreateAuditDto`, `UpdateAuditDto`
- `FindAuditsDto`, `CreateRevisionDto`
- `AuditResponseDto`

**Rutas principales:**
- `POST /api/audits` - Crear auditoría
- `POST /api/audits/:id/start` - Iniciar
- `POST /api/audits/:id/close` - Cerrar
- `POST /api/audits/:id/revisions` - Crear revisión
- `GET /api/audits` - Listar auditorías
- `GET /api/audits/:id/stats` - Estadísticas

---

### **3. Responses (✅ Evaluaciones de Standards)**

Todo lo relacionado con **evaluaciones individuales de standards**.

#### **Use Cases (4)**
- `InitializeResponsesUseCase` - Crear respuestas al crear auditoría
- `UpdateResponseUseCase` - Actualizar evaluación (score, findings, etc.)
- `GetResponseUseCase` - Obtener una respuesta específica
- `ListResponsesUseCase` - Listar respuestas de una auditoría

#### **Controller**
- `AuditResponsesController` - Endpoints REST para respuestas

#### **DTOs**
- `UpdateResponseDto`
- `ResponseResponseDto`

**Rutas principales:**
- `GET /api/audits/:auditId/responses` - Listar respuestas
- `GET /api/audits/:auditId/responses/:responseId` - Obtener respuesta
- `PATCH /api/audits/:auditId/responses/:responseId` - Actualizar evaluación

---

### **4. Assignments (👥 Asignación de Miembros)**

Todo lo relacionado con **asignar auditores a auditorías**.

#### **Use Cases (1)**
- `AssignMemberUseCase` - Asignar miembro con rol

#### **Controller**
- `AuditAssignmentsController` - Endpoints REST para asignaciones

#### **DTOs**
- `AssignMemberDto`
- `AuditAssignmentResponseDto`

**Rutas principales:**
- `POST /api/audits/:auditId/assignments` - Asignar miembro
- `GET /api/audits/:auditId/assignments` - Listar miembros

**Roles disponibles:**
- `LEAD_AUDITOR` - Auditor líder
- `AUDITOR` - Auditor
- `REVIEWER` - Revisor
- `OBSERVER` - Observador

---

### **5. Work Papers (📎 Papeles de Trabajo)**

**Estado:** Contexto futuro (solo DTOs por ahora)

Contendrá funcionalidad para adjuntar evidencias a evaluaciones:
- Subir archivos
- Clasificar evidencias (EVIDENCE, FINDING, OBSERVATION, DOCUMENT)
- Vincular con respuestas

**DTOs:**
- `AddWorkPaperDto`
- `WorkPaperResponseDto`

---

## 🔄 Flujo de Trabajo por Contextos

### **Ejemplo: Crear y completar una auditoría**

```
1. AUDIT MANAGEMENT - Crear auditoría
   POST /api/audits
   ↓
   CreateAuditUseCase
   ↓
   AuditFactory.createFromDto()

2. RESPONSES - Inicializar respuestas (automático)
   ↓
   InitializeResponsesUseCase
   ↓
   AuditResponseFactory.createManyFromStandards()

3. ASSIGNMENTS - Asignar auditores
   POST /api/audits/:id/assignments
   ↓
   AssignMemberUseCase

4. AUDIT MANAGEMENT - Iniciar auditoría
   POST /api/audits/:id/start
   ↓
   StartAuditUseCase
   ↓
   AuditFactory.markAsStarted()

5. RESPONSES - Evaluar standards
   PATCH /api/audits/:id/responses/:responseId
   ↓
   UpdateResponseUseCase
   ↓
   ResponseValidator.validateScore()
   ↓
   AuditResponseFactory.updateFromDto()

6. AUDIT MANAGEMENT - Cerrar auditoría
   POST /api/audits/:id/close
   ↓
   CloseAuditUseCase
   ↓
   AuditScoringService.calculateOverallScore()
   ↓
   AuditFactory.markAsClosed()
```

---

## 🎯 Ventajas de Esta Estructura

### **1. Navegación Intuitiva**
```
¿Buscas cómo crear auditorías? → audit-management/
¿Buscas cómo evaluar standards? → responses/
¿Buscas cómo asignar auditores? → assignments/
¿Buscas validadores? → core/validators/
```

### **2. Escalabilidad**
Agregar nuevos contextos es fácil:
```
src/modules/audits/
├── reports/              # Nuevo contexto para reportes
│   ├── use-cases/
│   ├── controllers/
│   └── dtos/
```

### **3. Responsabilidades Claras**
Cada contexto tiene su propio conjunto de:
- Use cases
- Controllers
- DTOs
- **Comparten:** Factories, Validators, Services (en `core/`)

### **4. Testing Aislado**
```typescript
// Test solo del contexto responses
describe('UpdateResponseUseCase', () => {
  // Mock solo lo necesario de core
})
```

### **5. Consistencia con el Proyecto**
- Misma filosofía que `auth/` (authentication, recovery, session)
- Fácil para nuevos desarrolladores
- Patrón estándar del proyecto

---

## 📦 Imports entre Contextos

### **Desde `audit-management` usar `responses`:**
```typescript
import { InitializeResponsesUseCase } from '../../../responses/use-cases/initialize-responses'
```

### **Desde cualquier contexto usar `core`:**
```typescript
import { AuditFactory } from '../../../core/factories'
import { AuditValidator } from '../../../core/validators'
import { AuditScoringService } from '../../../core/services'
```

### **Usar entidades/enums (compartidos):**
```typescript
import { AuditEntity } from '../../../entities/audit.entity'
import { AuditStatus } from '../../../enums/audit-status.enum'
```

---

## 🚀 Cómo Agregar Funcionalidad

### **Escenario 1: Agregar endpoint en contexto existente**

Quieres agregar "Archivar auditoría"

1. Crear use case:
```typescript
// audit-management/use-cases/archive-audit/archive-audit.use-case.ts
```

2. Agregar endpoint en controller:
```typescript
// audit-management/controllers/audits.controller.ts
@Post(':id/archive')
archive(@Param('id') id: string) {
  return this.archiveAuditUseCase.execute(id)
}
```

3. Exportar en index:
```typescript
// audit-management/use-cases/index.ts
export * from './archive-audit'
```

4. Registrar en module:
```typescript
// audits.module.ts
import { ArchiveAuditUseCase } from './audit-management/use-cases'
```

---

### **Escenario 2: Crear nuevo contexto**

Quieres agregar contexto de "Reports"

1. Crear estructura:
```bash
mkdir -p src/modules/audits/reports/{use-cases,controllers,dtos}
```

2. Crear use case:
```typescript
// reports/use-cases/generate-audit-report/generate-audit-report.use-case.ts
@Injectable()
export class GenerateAuditReportUseCase {
  constructor(
    private readonly scoringService: AuditScoringService, // desde core
  ) {}
}
```

3. Crear controller:
```typescript
// reports/controllers/audit-reports.controller.ts
@Controller('audits/:auditId/reports')
export class AuditReportsController {}
```

4. Crear index:
```typescript
// reports/index.ts
export * from './use-cases'
export * from './controllers'
export * from './dtos'
```

5. Registrar en module:
```typescript
// audits.module.ts
import { GenerateAuditReportUseCase } from './reports/use-cases'
import { AuditReportsController } from './reports/controllers'
```

---

## 🧹 Archivos Antiguos (Obsoletos)

Después de la migración, estos directorios se pueden eliminar:
- ~~`use-cases/`~~ (ahora distribuidos por contextos)
- ~~`controllers/`~~ (ahora en cada contexto)
- ~~`dtos/`~~ (ahora en cada contexto)
- ~~`factories/`~~ (ahora en `core/factories/`)
- ~~`validators/`~~ (ahora en `core/validators/`)
- ~~`services/`~~ (ahora en `core/services/`)

**Mantener:**
- ✅ `entities/` (compartidas)
- ✅ `repositories/` (compartidos)
- ✅ `enums/` (compartidos)
- ✅ `exceptions/` (compartidas)
- ✅ `constants/` (compartidas)

---

## 📚 Referencias

- **Patrón base:** `src/modules/auth/` (authentication, recovery, session)
- **Core factories:** `src/modules/audits/core/factories/`
- **Documentación técnica:** `ARCHITECTURE.md`

---

**Autor:** Refactorización por contextos
**Fecha:** 2026-02-07
**Versión:** 2.0 (Estructura por contextos)

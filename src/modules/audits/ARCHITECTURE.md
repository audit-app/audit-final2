# Audits Module Architecture

## 📐 Estructura del Módulo

El módulo de auditorías ha sido reorganizado siguiendo el patrón establecido en el módulo de `users`, separando responsabilidades en componentes especializados.

```
src/modules/audits/
├── factories/              # Creación/actualización de entidades desde DTOs
│   ├── audit.factory.ts
│   ├── audit-response.factory.ts
│   └── index.ts
├── validators/             # Validaciones de negocio
│   ├── audit.validator.ts
│   ├── response.validator.ts
│   └── index.ts
├── services/               # Lógica compleja de cálculo
│   ├── audit-scoring.service.ts
│   ├── weight-calculator.service.ts
│   └── index.ts
├── use-cases/              # Casos de uso (lógica de negocio)
├── controllers/            # Endpoints REST
├── repositories/           # Acceso a datos
├── entities/               # Modelos de base de datos
├── dtos/                   # Data Transfer Objects
├── enums/                  # Enumeraciones
├── exceptions/             # Excepciones personalizadas
└── constants/              # Constantes del módulo
```

---

## 🏭 Factories

Los factories centralizan la lógica de **creación y transformación** de entidades desde DTOs.

### **AuditFactory**

Responsabilidades:
- Crear `AuditEntity` desde `CreateAuditDto`
- Actualizar `AuditEntity` desde `UpdateAuditDto`
- Crear auditorías de revisión desde auditoría padre
- Transiciones de estado (iniciar, cerrar, archivar)

Métodos principales:
```typescript
// Crear nueva auditoría
createFromDto(dto: CreateAuditDto, code: string): AuditEntity

// Actualizar auditoría existente
updateFromDto(audit: AuditEntity, dto: UpdateAuditDto): AuditEntity

// Crear revisión desde auditoría padre
createRevisionFromParent(parentAudit: AuditEntity, code: string, name?: string): AuditEntity

// Transiciones de estado
markAsStarted(audit: AuditEntity): AuditEntity
markAsClosed(audit: AuditEntity, overallScore: number, maturityLevel?: number): AuditEntity
markAsArchived(audit: AuditEntity): AuditEntity
```

### **AuditResponseFactory**

Responsabilidades:
- Crear `AuditResponseEntity` desde `StandardEntity` (inicialización)
- Actualizar `AuditResponseEntity` desde `UpdateResponseDto`
- Cambios de estado de evaluación

Métodos principales:
```typescript
// Crear respuesta desde standard
createFromStandard(auditId: string, standard: StandardEntity): AuditResponseEntity

// Crear múltiples respuestas en batch
createManyFromStandards(auditId: string, standards: StandardEntity[]): AuditResponseEntity[]

// Actualizar respuesta existente
updateFromDto(response: AuditResponseEntity, dto: UpdateResponseDto): AuditResponseEntity

// Transiciones de estado
markAsInProgress(response: AuditResponseEntity, assignedUserId?: string): AuditResponseEntity
markAsCompleted(response: AuditResponseEntity): AuditResponseEntity
markAsReviewed(response: AuditResponseEntity, reviewerId: string): AuditResponseEntity
reset(response: AuditResponseEntity): AuditResponseEntity
```

---

## ✅ Validators

Los validators contienen **validaciones de negocio** reutilizables.

### **AuditValidator**

Responsabilidades:
- Validar existencia de auditorías
- Validar transiciones de estado
- Validar reglas de negocio (templates, fechas, permisos)

Métodos principales:
```typescript
// Validar existencia y retornar entidad
validateAndGetAudit(auditId: string): Promise<AuditEntity>

// Validar código único
validateUniqueCode(code: string): Promise<void>

// Validar estados
validateAuditStatus(audit: AuditEntity, expectedStatus: AuditStatus, operation: string): void
validateIsEditable(audit: AuditEntity): void
validateIsActive(audit: AuditEntity): void

// Validar transiciones
validateCanStart(audit: AuditEntity): void
validateCanClose(audit: AuditEntity): void
validateCanCreateRevision(parentAudit: AuditEntity): void

// Validar template
validateTemplateIsPublished(templateId: string): Promise<TemplateEntity>

// Validar fechas
validateDates(startDate: Date | null, endDate: Date | null): void
```

### **ResponseValidator**

Responsabilidades:
- Validar existencia de respuestas
- Validar pertenencia a auditoría
- Validar datos de evaluación (score, maturity level)
- Validar ponderaciones

Métodos principales:
```typescript
// Validar existencia y retornar entidad
validateAndGetResponse(responseId: string): Promise<AuditResponseEntity>

// Validar pertenencia
validateBelongsToAudit(response: AuditResponseEntity, auditId: string): void

// Validar datos de evaluación
validateScore(score: number): void
validateMaturityLevel(level: number, minLevel?: number, maxLevel?: number): void

// Validar transiciones
validateCanBeReviewed(response: AuditResponseEntity): void
validateCanBeCompleted(response: AuditResponseEntity): void

// Validar ponderaciones
validateWeight(weight: number): void
validateWeightsSum(responses: AuditResponseEntity[]): void
validateAllResponsesComplete(responses: AuditResponseEntity[]): void
```

---

## 🧮 Services

Los services contienen **lógica compleja de cálculo** que no pertenece a entidades ni use cases.

### **AuditScoringService**

Responsabilidades:
- Calcular score global de auditoría
- Calcular niveles de madurez promedio
- Calcular métricas de cumplimiento
- Análisis estadístico de scores

Métodos principales:
```typescript
// Cálculo de scores
calculateOverallScore(responses: AuditResponseEntity[]): number
calculateWeightedScore(response: AuditResponseEntity): number

// Cálculo de madurez
calculateAverageMaturityLevel(responses: AuditResponseEntity[]): number | null

// Métricas de cumplimiento
calculateComplianceMetrics(responses: AuditResponseEntity[]): ComplianceMetrics

// Progreso
calculateEvaluationProgress(responses: AuditResponseEntity[]): number
areAllResponsesEvaluated(responses: AuditResponseEntity[]): boolean

// Estadísticas
getScoreStatistics(responses: AuditResponseEntity[]): { min, max, average } | null
getLowestScoringResponses(responses: AuditResponseEntity[], topN?: number): AuditResponseEntity[]
getHighestScoringResponses(responses: AuditResponseEntity[], topN?: number): AuditResponseEntity[]
```

**Fórmulas:**
- `overallScore = Σ(score × weight / 100)`
- `weightedScore = (score × weight) / 100`
- `maturityLevel = promedio(achievedMaturityLevel)`

### **WeightCalculatorService**

Responsabilidades:
- Validar suma de pesos (debe ser 100)
- Calcular distribución equitativa
- Normalizar pesos con errores de redondeo
- Redistribuir pesos al agregar/eliminar items

Métodos principales:
```typescript
// Validación de pesos
validateWeightsSum(weights: number[]): void
validateStandardsWeights(standards: StandardEntity[]): void
validateResponsesWeights(responses: AuditResponseEntity[]): void

// Cálculo de pesos
calculateTotalWeight(weights: number[]): number
calculateEqualWeights(count: number): number[]
normalizeWeights(weights: number[]): number[]

// Redistribución
redistributeWeight(weights: number[], indexToRemove: number): number[]
calculateWeightImpact(currentWeights: number[], index: number, newWeight: number): number[]

// Estadísticas
isWeightSumValid(weights: number[]): boolean
getWeightStatistics(weights: number[]): { min, max, average, total }
```

**Reglas:**
- La suma de weights debe ser **exactamente 100**
- Tolerancia permitida: ±0.01 (por redondeo)
- Solo se consideran standards con `isAuditable = true`

---

## 🔄 Flujo de Uso en Use Cases

### **Antes (mezclado)**

```typescript
@Injectable()
export class CreateAuditUseCase {
  async execute(dto: CreateAuditDto) {
    // ❌ Validación mezclada con lógica
    const template = await this.templatesRepository.findById(dto.templateId)
    if (!template) throw new TemplateNotFoundException()
    if (template.status !== TemplateStatus.PUBLISHED) throw new Error(...)

    // ❌ Creación manual de entidad
    const audit = new AuditEntity()
    audit.code = code
    audit.name = dto.name
    audit.description = dto.description || null
    audit.templateId = dto.templateId
    // ... 15 líneas más

    return await this.auditsRepository.save(audit)
  }
}
```

### **Después (separado)**

```typescript
@Injectable()
export class CreateAuditUseCase {
  constructor(
    private readonly auditsRepository: IAuditsRepository,
    private readonly auditFactory: AuditFactory,        // ✅ Factory
    private readonly auditValidator: AuditValidator,    // ✅ Validator
  ) {}

  async execute(dto: CreateAuditDto) {
    // ✅ Validación separada y reutilizable
    await this.auditValidator.validateTemplateIsPublished(dto.templateId)
    this.auditValidator.validateDates(dto.startDate, dto.endDate)

    const code = await this.auditsRepository.generateNextCode()
    await this.auditValidator.validateUniqueCode(code)

    // ✅ Creación limpia con factory
    const audit = this.auditFactory.createFromDto(dto, code)

    return await this.auditsRepository.save(audit)
  }
}
```

---

## 📊 Ejemplo Completo: Cerrar Auditoría

```typescript
@Injectable()
export class CloseAuditUseCase {
  constructor(
    private readonly auditsRepository: IAuditsRepository,
    private readonly responsesRepository: IAuditResponsesRepository,
    private readonly auditFactory: AuditFactory,
    private readonly auditValidator: AuditValidator,
    private readonly responseValidator: ResponseValidator,
    private readonly scoringService: AuditScoringService,
  ) {}

  @Transactional()
  async execute(auditId: string): Promise<AuditEntity> {
    // 1. Validar auditoría existe y puede cerrarse
    const audit = await this.auditValidator.validateAndGetAudit(auditId)
    this.auditValidator.validateCanClose(audit)

    // 2. Obtener respuestas
    const responses = await this.responsesRepository.findByAudit(auditId)

    // 3. Validar que todas las respuestas estén completas
    this.responseValidator.validateAllResponsesComplete(responses)

    // 4. Calcular score y madurez usando service
    const overallScore = this.scoringService.calculateOverallScore(responses)
    const maturityLevel = this.scoringService.calculateAverageMaturityLevel(responses)

    // 5. Cerrar auditoría usando factory
    this.auditFactory.markAsClosed(audit, overallScore, maturityLevel)

    // 6. Guardar
    return await this.auditsRepository.save(audit)
  }
}
```

---

## 🎯 Beneficios de la Reorganización

### **1. Separación de Responsabilidades**
- **Factories:** Transformación de datos
- **Validators:** Reglas de negocio
- **Services:** Cálculos complejos
- **Use Cases:** Orquestación

### **2. Reutilización**
```typescript
// Validator reutilizado en múltiples use cases
await this.auditValidator.validateTemplateIsPublished(templateId)

// Service reutilizado en reportes, dashboards, etc.
const score = this.scoringService.calculateOverallScore(responses)
```

### **3. Testing Simplificado**
```typescript
// Test del factory (sin base de datos)
describe('AuditFactory', () => {
  it('should create audit from DTO', () => {
    const dto = { name: 'Test', templateId: '123', ... }
    const audit = factory.createFromDto(dto, 'AUD-2024-001')
    expect(audit.name).toBe('Test')
  })
})

// Test del validator (mock del repository)
describe('AuditValidator', () => {
  it('should validate unique code', async () => {
    jest.spyOn(repository, 'findByCode').mockResolvedValue(null)
    await expect(validator.validateUniqueCode('AUD-2024-001')).resolves.not.toThrow()
  })
})

// Test del service (sin dependencias)
describe('AuditScoringService', () => {
  it('should calculate overall score', () => {
    const responses = [
      { score: 80, weight: 30 },  // contribuye 24
      { score: 90, weight: 70 },  // contribuye 63
    ]
    const score = service.calculateOverallScore(responses)
    expect(score).toBe(87)
  })
})
```

### **4. Mantenibilidad**
- Cambios en lógica de creación → Solo editar factory
- Cambios en validaciones → Solo editar validator
- Cambios en fórmulas de score → Solo editar service
- Use cases permanecen estables

### **5. Consistencia**
- Misma estructura que el módulo `users`
- Misma estructura que el módulo `organizations`
- Fácil de navegar para nuevos desarrolladores

---

## 🔧 Cómo Agregar Nuevas Funcionalidades

### **Agregar nueva validación**
```typescript
// 1. Agregar método en AuditValidator
validateCustomRule(audit: AuditEntity): void {
  if (!audit.someCondition) {
    throw new BadRequestException('Custom rule failed')
  }
}

// 2. Usar en use case
this.auditValidator.validateCustomRule(audit)
```

### **Agregar nuevo cálculo**
```typescript
// 1. Agregar método en AuditScoringService
calculateCustomMetric(responses: AuditResponseEntity[]): number {
  // lógica de cálculo
  return result
}

// 2. Usar en use case o controller
const metric = this.scoringService.calculateCustomMetric(responses)
```

### **Agregar nueva transformación**
```typescript
// 1. Agregar método en AuditFactory
createSpecialAudit(dto: SpecialDto): AuditEntity {
  const audit = new AuditEntity()
  // lógica de transformación
  return audit
}

// 2. Usar en use case
const audit = this.auditFactory.createSpecialAudit(dto)
```

---

## 📚 Referencias

- **Patrón base:** `src/modules/users/` (factories + validators)
- **BaseRepository:** `src/@core/repositories/base.repository.ts`
- **Testing:** `src/modules/users/validators/user.validator.spec.ts`

---

## ✅ Checklist de Migración (Otros Use Cases)

Si deseas migrar los demás use cases a esta arquitectura:

- [ ] `StartAuditUseCase` - Usar `AuditFactory.markAsStarted()`
- [ ] `CloseAuditUseCase` - Usar `AuditScoringService.calculateOverallScore()`
- [ ] `CreateRevisionUseCase` - Usar `AuditFactory.createRevisionFromParent()`
- [ ] `AssignMemberUseCase` - Usar `AuditValidator.validateIsEditable()`
- [ ] `ListResponsesUseCase` - Usar `AuditValidator.validateAndGetAudit()`
- [ ] `GetResponseUseCase` - Usar `ResponseValidator.validateAndGetResponse()`
- [ ] `GetAuditStatsUseCase` - Usar `AuditScoringService` para métricas

---

**Autor:** Refactorización realizada siguiendo el patrón de `users` module
**Fecha:** 2026-02-06
**Versión:** 1.0

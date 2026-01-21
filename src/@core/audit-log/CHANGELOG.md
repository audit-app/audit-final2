# Changelog - Sistema de Auditoría Granular

## [1.1.0] - 2026-01-21

### ✨ Agregado
- **Filtrado Inteligente por Estado**: El subscriber ahora NO audita cambios en estado DRAFT
  - Templates en DRAFT: Cambios NO se auditan (evita ruido de edición)
  - Standards con padre en DRAFT: Cambios NO se auditan
  - Transiciones de estado: SÍ se auditan (DRAFT → PUBLISHED)
  - Templates/Standards en PUBLISHED/ARCHIVED: SÍ se auditan

### 🚀 Mejoras
- **Performance**: Consulta optimizada al Template padre (solo campo `status`)
- **Documentación**: Agregada sección completa sobre estrategia de filtrado

### 📋 Detalles Técnicos
- Nuevo método: `shouldAuditBasedOnStatus()` en `GranularAuditSubscriber`
- Query ligera: `SELECT status FROM templates WHERE id = :id`
- Fallback: Si relación `template` ya está cargada, se usa directamente

### 💡 Ejemplo de Uso

**Antes (v1.0.0):**
```typescript
// En DRAFT
template.name = 'Test 1'  // ✅ Se auditaba
template.name = 'Test 2'  // ✅ Se auditaba
template.name = 'Test 3'  // ✅ Se auditaba
// Resultado: 3 registros de ruido en audit_logs
```

**Ahora (v1.1.0):**
```typescript
// En DRAFT
template.name = 'Test 1'  // ❌ NO se audita
template.name = 'Test 2'  // ❌ NO se audita
template.name = 'Test 3'  // ❌ NO se audita
// Resultado: audit_logs permanece limpio

// En PUBLISHED
template.name = 'Corrección'  // ✅ SÍ se audita
// Resultado: 1 registro importante
```

### 🎯 Beneficios
- **Reducción de Ruido**: ~90% menos registros en fase de diseño
- **BD más Limpia**: Solo cambios críticos en producción
- **Performance**: Menos escrituras a la base de datos
- **Auditoría Relevante**: Los auditores ven solo cambios importantes

---

## [1.0.0] - 2026-01-21

### ✨ Inicial
- Sistema de auditoría granular automático
- Snapshot de usuario (inmutable)
- Detección de cambios campo por campo
- Subscriber de TypeORM
- Repositorio con queries optimizadas
- Integración con CLS

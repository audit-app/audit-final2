import { Module } from '@nestjs/common'
import { TemplatesModule } from '../templates/templates.module'
import { StandardsModule } from '../standards/standards.module'

// Services
import { TemplateImportService } from './services/template-import.service'
import { ImportPipelineService } from './pipeline/import-pipeline.service'

// Pipeline Steps
import {
  ParseExcelStep,
  ValidateDataStep,
  ValidateHierarchyStep,
  PersistDataStep,
} from './pipeline/steps'

/**
 * Import Module
 *
 * Módulo independiente para importación de templates y standards
 * usando el patrón Pipeline para separación de responsabilidades.
 *
 * Arquitectura:
 * - TemplateImportService: API pública
 * - ImportPipelineService: Orquestador de pipeline
 * - Steps: Cada uno con una responsabilidad específica
 *   1. ParseExcelStep: Excel → DTO[]
 *   2. ValidateDataStep: Validación individual
 *   3. ValidateHierarchyStep: Validación jerárquica
 *   4. PersistDataStep: Guardar con cascade
 *
 * Beneficios:
 * - ✅ Separación de responsabilidades (SRP)
 * - ✅ Reutilizable desde múltiples contextos
 * - ✅ Sin dependencias circulares
 * - ✅ Fácil de testear
 * - ✅ Fácil de extender (agregar nuevos steps)
 */
@Module({
  imports: [
    TemplatesModule, // Proporciona TEMPLATES_REPOSITORY
    StandardsModule, // Proporciona STANDARDS_REPOSITORY
  ],
  providers: [
    // Pipeline orchestrator
    ImportPipelineService,

    // Pipeline steps (orden lógico de ejecución)
    ParseExcelStep,
    ValidateDataStep,
    ValidateHierarchyStep,
    PersistDataStep,

    // Public API service
    TemplateImportService,
  ],
  exports: [
    TemplateImportService, // Exportar para uso en controllers/otros módulos
  ],
})
export class ImportModule {}

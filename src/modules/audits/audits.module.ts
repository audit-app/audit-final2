import { Module } from '@nestjs/common'
import { ReportsModule } from '@core/reports'

// Core (Factories, Validators, Services)
import { AuditFactory, AuditResponseFactory } from './core/factories'
import { AuditValidator, ResponseValidator } from './core/validators'
import { AuditScoringService, WeightCalculatorService } from './core/services'

// Audit Management Context
import {
  CreateAuditUseCase,
  StartAuditUseCase,
  CloseAuditUseCase,
  CreateRevisionUseCase,
  FindAuditsUseCase,
  GetAuditStatsUseCase,
} from './audit-management/use-cases'
import { AuditsController } from './audit-management/controllers'

// Responses Context
import {
  InitializeResponsesUseCase,
  UpdateResponseUseCase,
  ListResponsesUseCase,
  GetResponseUseCase,
} from './responses/use-cases'
import { AuditResponsesController } from './responses/controllers'

// Assignments Context
import { AssignMemberUseCase } from './assignments/use-cases'
import { AuditAssignmentsController } from './assignments/controllers'

// Reports Context
import { ChartGeneratorService } from './reports/services'
import { GenerateComplianceReportUseCase } from './reports/use-cases'
import { AuditReportsController } from './reports/controllers'

@Module({
  imports: [ReportsModule],
  controllers: [
    // Audit Management
    AuditsController,

    // Responses
    AuditResponsesController,

    // Assignments
    AuditAssignmentsController,

    // Reports
    AuditReportsController,
  ],
  providers: [
    // ============================================
    // CORE - Shared Infrastructure
    // ============================================

    // Factories (creación de entidades desde DTOs)
    AuditFactory,
    AuditResponseFactory,

    // Validators (validaciones de negocio)
    AuditValidator,
    ResponseValidator,

    // Services (lógica compleja de cálculo)
    AuditScoringService,
    WeightCalculatorService,

    // ============================================
    // AUDIT MANAGEMENT - Gestión de auditorías
    // ============================================
    CreateAuditUseCase,
    StartAuditUseCase,
    CloseAuditUseCase,
    CreateRevisionUseCase,
    FindAuditsUseCase,
    GetAuditStatsUseCase,

    // ============================================
    // RESPONSES - Evaluaciones de standards
    // ============================================
    InitializeResponsesUseCase,
    UpdateResponseUseCase,
    ListResponsesUseCase,
    GetResponseUseCase,

    // ============================================
    // ASSIGNMENTS - Asignación de miembros
    // ============================================
    AssignMemberUseCase,

    // ============================================
    // REPORTS - Generación de reportes
    // ============================================
    ChartGeneratorService,
    GenerateComplianceReportUseCase,
  ],
  exports: [
    // Export use cases if needed by other modules (future)
    FindAuditsUseCase,
    GetAuditStatsUseCase,

    // Export services for external use
    AuditScoringService,
    WeightCalculatorService,

    // Export validators for external validation
    AuditValidator,
    ResponseValidator,
  ],
})
export class AuditsModule {}

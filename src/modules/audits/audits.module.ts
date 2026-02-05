import { Module } from '@nestjs/common'
import {
  CreateAuditUseCase,
  AssignMemberUseCase,
  StartAuditUseCase,
  CloseAuditUseCase,
  CreateRevisionUseCase,
  FindAuditsUseCase,
  InitializeResponsesUseCase,
  UpdateResponseUseCase,
  ListResponsesUseCase,
  GetResponseUseCase,
  GetAuditStatsUseCase,
} from './use-cases'
import {
  AuditsController,
  AuditAssignmentsController,
  AuditResponsesController,
} from './controllers'

@Module({
  imports: [],
  controllers: [
    AuditsController,
    AuditAssignmentsController,
    AuditResponsesController,
  ],
  providers: [
    // Audits Use Cases
    CreateAuditUseCase,
    AssignMemberUseCase,
    StartAuditUseCase,
    CloseAuditUseCase,
    CreateRevisionUseCase,
    FindAuditsUseCase,
    // Responses Use Cases
    InitializeResponsesUseCase,
    UpdateResponseUseCase,
    ListResponsesUseCase,
    GetResponseUseCase,
    GetAuditStatsUseCase,
  ],
  exports: [
    // Export use cases if needed by other modules (future)
    FindAuditsUseCase,
    GetAuditStatsUseCase,
  ],
})
export class AuditsModule {}

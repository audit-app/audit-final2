import { Module } from '@nestjs/common'
import {
  CreateAuditUseCase,
  AssignMemberUseCase,
  StartAuditUseCase,
  CloseAuditUseCase,
  CreateRevisionUseCase,
  FindAuditsUseCase,
} from './use-cases'
import { AuditsController } from './controllers/audits.controller'
import { AuditAssignmentsController } from './controllers/audit-assignments.controller'

@Module({
  imports: [],
  controllers: [AuditsController, AuditAssignmentsController],
  providers: [
    // Use Cases
    CreateAuditUseCase,
    AssignMemberUseCase,
    StartAuditUseCase,
    CloseAuditUseCase,
    CreateRevisionUseCase,
    FindAuditsUseCase,
  ],
  exports: [
    // Export use cases if needed by other modules (future)
    FindAuditsUseCase,
  ],
})
export class AuditsModule {}

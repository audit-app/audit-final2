import { Module, Global } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// ========== ENTITIES ==========
import { UserEntity } from '../../../modules/users/entities/user.entity'
import { OrganizationEntity } from '../../../modules/organizations/entities/organization.entity'
import { TemplateEntity } from '../../../modules/audit-library/templates/entities/template.entity'
import { StandardEntity } from '../../../modules/audit-library/standards/entities/standard.entity'
import { MaturityFrameworkEntity } from '../../../modules/maturity/frameworks/entities/maturity-framework.entity'
import { MaturityLevelEntity } from '../../../modules/maturity/levels/entities/maturity-level.entity'
import { AuditEntity } from '../../../modules/audits/entities/audit.entity'
import { AuditAssignmentEntity } from '../../../modules/audits/entities/audit-assignment.entity'
import { AuditResponseEntity } from '../../../modules/audits/entities/audit-response.entity'
import { AuditWorkPaperEntity } from '../../../modules/audits/entities/audit-work-paper.entity'

// ========== REPOSITORIES ==========
import { UsersRepository } from '../../../modules/users/repositories/users.repository'
import { OrganizationRepository } from '../../../modules/organizations/repositories/organization.repository'
import { TemplatesRepository } from '../../../modules/audit-library/templates/repositories/templates.repository'
import { StandardsRepository } from '../../../modules/audit-library/standards/repositories/standards.repository'
import { MaturityFrameworksRepository } from '../../../modules/maturity/frameworks/repositories/frameworks.repository'
import { MaturityLevelsRepository } from '../../../modules/maturity/levels/repositories/maturity-levels.repository'
import { AuditsRepository } from '../../../modules/audits/repositories/audits.repository'
import { AuditAssignmentsRepository } from '../../../modules/audits/repositories/audit-assignments.repository'
import { AuditResponsesRepository } from '../../../modules/audits/repositories/audit-responses.repository'
import { AuditWorkPapersRepository } from '../../../modules/audits/repositories/audit-work-papers.repository'

// ========== TOKENS ==========
import { USERS_REPOSITORY } from '../../../modules/users/tokens'
import { ORGANIZATION_REPOSITORY } from '../../../modules/organizations/tokens'
import { FRAMEWORKS_REPOSITORY } from '../../../modules/maturity/frameworks/tokens'
import { LEVELS_REPOSITORY } from '../../../modules/maturity/levels/tokens'
import { TEMPLATES_REPOSITORY } from 'src/modules/audit-library/templates/tokens'
import { STANDARDS_REPOSITORY } from 'src/modules/audit-library/standards/tokens'
import {
  AUDITS_REPOSITORY,
  AUDIT_ASSIGNMENTS_REPOSITORY,
  AUDIT_RESPONSES_REPOSITORY,
  AUDIT_WORK_PAPERS_REPOSITORY,
} from '../../../modules/audits/tokens'

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      OrganizationEntity,
      TemplateEntity,
      StandardEntity,
      MaturityFrameworkEntity,
      MaturityLevelEntity,
      AuditEntity,
      AuditAssignmentEntity,
      AuditResponseEntity,
      AuditWorkPaperEntity,
    ]),
  ],
  providers: [
    // ========== Users Repository ==========
    {
      provide: USERS_REPOSITORY,
      useClass: UsersRepository,
    },

    // ========== Organizations Repository ==========
    {
      provide: ORGANIZATION_REPOSITORY,
      useClass: OrganizationRepository,
    },

    // ========== Templates Repository ==========
    {
      provide: TEMPLATES_REPOSITORY,
      useClass: TemplatesRepository,
    },

    // ========== Standards Repository ==========
    {
      provide: STANDARDS_REPOSITORY,
      useClass: StandardsRepository,
    },

    // ========== Maturity Frameworks Repository ==========
    {
      provide: FRAMEWORKS_REPOSITORY,
      useClass: MaturityFrameworksRepository,
    },

    // ========== Maturity Levels Repository ==========
    {
      provide: LEVELS_REPOSITORY,
      useClass: MaturityLevelsRepository,
    },

    // ========== Audits Repository ==========
    {
      provide: AUDITS_REPOSITORY,
      useClass: AuditsRepository,
    },

    // ========== Audit Assignments Repository ==========
    {
      provide: AUDIT_ASSIGNMENTS_REPOSITORY,
      useClass: AuditAssignmentsRepository,
    },

    // ========== Audit Responses Repository ==========
    {
      provide: AUDIT_RESPONSES_REPOSITORY,
      useClass: AuditResponsesRepository,
    },

    // ========== Audit Work Papers Repository ==========
    {
      provide: AUDIT_WORK_PAPERS_REPOSITORY,
      useClass: AuditWorkPapersRepository,
    },
  ],
  exports: [
    USERS_REPOSITORY,
    ORGANIZATION_REPOSITORY,
    TEMPLATES_REPOSITORY,
    STANDARDS_REPOSITORY,
    FRAMEWORKS_REPOSITORY,
    LEVELS_REPOSITORY,
    AUDITS_REPOSITORY,
    AUDIT_ASSIGNMENTS_REPOSITORY,
    AUDIT_RESPONSES_REPOSITORY,
    AUDIT_WORK_PAPERS_REPOSITORY,
  ],
})
export class PersistenceModule {}

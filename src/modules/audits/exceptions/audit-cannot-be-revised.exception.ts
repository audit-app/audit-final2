import { BadRequestException } from '@nestjs/common'
import { AuditStatus } from '../enums/audit-status.enum'

export class AuditCannotBeRevisedException extends BadRequestException {
  constructor(auditId: string, currentStatus: AuditStatus) {
    super(
      `No se puede crear una auditoría de revisión. La auditoría "${auditId}" debe estar en estado CLOSED (actual: ${currentStatus})`,
    )
  }
}

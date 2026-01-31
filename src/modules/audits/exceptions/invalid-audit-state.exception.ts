import { BadRequestException } from '@nestjs/common'
import { AuditStatus } from '../enums/audit-status.enum'

export class InvalidAuditStateException extends BadRequestException {
  constructor(currentStatus: AuditStatus, action: string) {
    super(
      `No se puede ${action} una auditoría en estado "${currentStatus}"`,
    )
  }
}

import { NotFoundException } from '@nestjs/common'

export class AuditNotFoundException extends NotFoundException {
  constructor(auditId: string) {
    super(`Auditoría con ID "${auditId}" no encontrada`)
  }
}

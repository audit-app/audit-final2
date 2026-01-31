import { ConflictException } from '@nestjs/common'

export class AuditAlreadyExistsException extends ConflictException {
  constructor(code: string) {
    super(`Ya existe una auditoría con el código "${code}"`)
  }
}

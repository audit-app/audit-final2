import { ConflictException } from '@nestjs/common'

export class StandardRepeatCodeException extends ConflictException {
  constructor(code: string) {
    super(`El estandar con codigo ${code} ya existe en esta plantilla`)
  }
}

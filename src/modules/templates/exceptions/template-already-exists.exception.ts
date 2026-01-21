import { ConflictException } from '@nestjs/common'

export class TemplateAlreadyExistsException extends ConflictException {
  constructor(code: string, version: string) {
    super(
      `Ya existe una plantilla con el codigo '${code}' versión '${version}'`,
    )
  }
}

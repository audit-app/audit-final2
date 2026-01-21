import { BadRequestException } from '@nestjs/common'

export class TemplateNotEditableException extends BadRequestException {
  constructor(name: string) {
    super(`La plantilla ${name} no es editable porque está archivada`)
  }
}

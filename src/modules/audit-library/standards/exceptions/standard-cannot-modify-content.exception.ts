import { BadRequestException } from '@nestjs/common'

export class StandardCannotModifyContentException extends BadRequestException {
  constructor(templateName: string, templateStatus: string) {
    super(
      `No se puede modificar el contenido del standard porque la plantilla "${templateName}" está en estado ${templateStatus}. Solo se permite en DRAFT o PUBLISHED.`,
    )
  }
}

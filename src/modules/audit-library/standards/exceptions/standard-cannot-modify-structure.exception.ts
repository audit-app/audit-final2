import { BadRequestException } from '@nestjs/common'

export class StandardCannotModifyStructureException extends BadRequestException {
  constructor(templateName: string, templateStatus: string) {
    super(
      `No se puede modificar la estructura del standard porque la plantilla "${templateName}" está en estado ${templateStatus}. Solo se permite en estado DRAFT.`,
    )
  }
}

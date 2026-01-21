import { NotFoundException } from '@nestjs/common'

export class StandardNotFoundException extends NotFoundException {
  constructor(standardId: string) {
    super(`El estandar con ID ${standardId} no encontrado`)
  }
}

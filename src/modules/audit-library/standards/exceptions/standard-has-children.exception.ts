import { ConflictException } from '@nestjs/common'

export class StandardHasChildrenException extends ConflictException {
  constructor(standardId: string, childCount: number) {
    super(
      `No se puede eliminar el standard ${standardId} porque tiene ${childCount} hijo(s). Elimine los hijos primero.`,
    )
  }
}

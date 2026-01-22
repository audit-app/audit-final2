import { BadRequestException } from '@nestjs/common'

export class StandardWithChildrenCannotBeAuditableException extends BadRequestException {
  constructor(standardId: string, childCount: number) {
    super(
      `El standard ${standardId} tiene ${childCount} hijo(s). Los standards con hijos solo pueden ser agrupadores (isAuditable=false).`,
    )
  }
}

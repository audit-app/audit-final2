import { ConflictException } from '@nestjs/common'

export class OrganizationHasActiveUsersException extends ConflictException {
  constructor() {
    super(
      'La organización no puede ser desactivada porque tiene usuarios activos asociados',
    )
  }
}

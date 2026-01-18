import { PartialType, OmitType } from '@nestjs/swagger'
import { CreateUserDto } from '../create-user/create-user.dto'

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['organizationId'] as const),
) {}

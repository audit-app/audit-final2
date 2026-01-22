import { PartialType, OmitType } from '@nestjs/swagger'
import { CreateMaturityLevelDto } from './create-maturity-level.dto'
export class UpdateMaturityLevelDto extends PartialType(
  OmitType(CreateMaturityLevelDto, ['frameworkId', 'order', 'level'] as const),
) {}

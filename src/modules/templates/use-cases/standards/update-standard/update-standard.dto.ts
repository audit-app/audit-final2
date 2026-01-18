import { PartialType, OmitType } from '@nestjs/swagger'
import { CreateStandardDto } from '../../../dtos'

export class UpdateStandardDto extends PartialType(
  OmitType(CreateStandardDto, ['templateId'] as const),
) {}

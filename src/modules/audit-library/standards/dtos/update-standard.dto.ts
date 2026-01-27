import { OmitType, PartialType } from '@nestjs/swagger'
import { CreateStandardDto } from './create-standard.dto'

export class UpdateStandardDto extends PartialType(
  OmitType(CreateStandardDto, ['templateId', 'parentId', 'code'] as const),
) {}

import { OmitType, PartialType } from '@nestjs/swagger'
import { CreateTemplateDto } from './create-template.dto'

export class UpdateTemplateDto extends PartialType(
  OmitType(CreateTemplateDto, ['code', 'version']),
) {}

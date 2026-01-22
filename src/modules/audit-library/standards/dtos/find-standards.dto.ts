import { IsOptional, IsString } from '@core/i18n'

export class FindStandardsDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsString()
  templateId: string
}

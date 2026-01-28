import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

class TableOfContentsDto {
  @IsBoolean()
  @IsOptional()
  show?: boolean

  @IsString()
  @IsOptional()
  title?: string

  @IsBoolean()
  @IsOptional()
  includePageNumbers?: boolean

  @IsNumber()
  @Min(1)
  @Max(6)
  @IsOptional()
  maxLevel?: number
}

export class UserStyleOverridesDto {
  @IsString()
  @IsOptional()
  fontFamily?: string

  @IsNumber()
  @Min(0.5)
  @Max(3)
  @IsOptional()
  fontSizeScale?: number

  @IsString()
  @IsOptional()
  textColor?: string

  @IsString()
  @IsOptional()
  headingColor?: string

  @IsNumber()
  @Min(0)
  @Max(50)
  @IsOptional()
  paragraphSpacing?: number

  @IsBoolean()
  @IsOptional()
  showTableBorders?: boolean

  @IsBoolean()
  @IsOptional()
  tableAlternateRows?: boolean

  @IsBoolean()
  @IsOptional()
  showHeaderBorder?: boolean

  @IsBoolean()
  @IsOptional()
  showFooterBorder?: boolean

  @IsString()
  @IsOptional()
  customHeaderText?: string

  @IsString()
  @IsOptional()
  customFooterText?: string

  @ValidateNested()
  @Type(() => TableOfContentsDto)
  @IsOptional()
  tableOfContents?: TableOfContentsDto
}

import { IsString, IsOptional, MinLength, MaxLength } from '@core/i18n'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { TEMPLATE_CONSTRAINTS } from '../constants'

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Código único agrupador de la familia de la norma',
    example: 'ISO-27001',
    minLength: TEMPLATE_CONSTRAINTS.CODE.MIN_LENGTH,
    maxLength: TEMPLATE_CONSTRAINTS.CODE.MAX_LENGTH,
  })
  @IsString()
  @MinLength(TEMPLATE_CONSTRAINTS.CODE.MIN_LENGTH)
  @MaxLength(TEMPLATE_CONSTRAINTS.CODE.MAX_LENGTH)
  code: string

  @ApiProperty({
    description: 'Nombre completo y descriptivo de la plantilla',
    example: 'Norma ISO/IEC 27001:2022 Seguridad de la Información',
    minLength: TEMPLATE_CONSTRAINTS.NAME.MIN_LENGTH,
    maxLength: TEMPLATE_CONSTRAINTS.NAME.MAX_LENGTH,
  })
  @IsString()
  @MinLength(TEMPLATE_CONSTRAINTS.NAME.MIN_LENGTH)
  @MaxLength(TEMPLATE_CONSTRAINTS.NAME.MAX_LENGTH)
  name: string

  @ApiPropertyOptional({
    description: 'Descripción detallada, alcance o notas sobre esta versión',
    example: 'Versión actualizada con los nuevos controles del Anexo A.',
    maxLength: TEMPLATE_CONSTRAINTS.DESCRIPTION.MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(TEMPLATE_CONSTRAINTS.DESCRIPTION.MAX_LENGTH)
  description?: string

  @ApiProperty({
    description: 'Identificador de la versión (Año, Revisión o SemVer)',
    example: '2022',
    minLength: TEMPLATE_CONSTRAINTS.VERSION.MIN_LENGTH,
    maxLength: TEMPLATE_CONSTRAINTS.VERSION.MAX_LENGTH,
  })
  @IsString()
  @MinLength(TEMPLATE_CONSTRAINTS.VERSION.MIN_LENGTH)
  @MaxLength(TEMPLATE_CONSTRAINTS.VERSION.MAX_LENGTH)
  version: string
}

import {
  IsString,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
} from '@core/i18n'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { STANDARDS_CONSTRAINTS } from '../constants'

export class CreateStandardDto {
  @ApiProperty({
    description: 'ID del template al que pertenece',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  templateId: string

  @ApiPropertyOptional({
    description: 'ID del standard padre (null para nivel raíz)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID('4')
  parentId?: string

  @ApiProperty({
    description: 'Código único del standard',
    example: 'A.5.1.1',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(STANDARDS_CONSTRAINTS.CODE.MIN_LENGTH)
  @MaxLength(STANDARDS_CONSTRAINTS.CODE.MAX_LENGTH)
  code: string

  @ApiProperty({
    description: 'Título del standard',
    example: 'Políticas para la seguridad de la información',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @MinLength(STANDARDS_CONSTRAINTS.TITLE.MIN_LENGTH)
  @MaxLength(STANDARDS_CONSTRAINTS.TITLE.MAX_LENGTH)
  title: string

  @ApiPropertyOptional({
    description: 'Descripción detallada',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(STANDARDS_CONSTRAINTS.DESCRIPTION.MAX_LENGTH)
  description?: string
}

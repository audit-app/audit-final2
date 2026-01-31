import { IsString, IsOptional, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO para agregar un papel de trabajo/evidencia a una evaluación
 * El archivo se sube mediante multipart/form-data
 */
export class AddWorkPaperDto {
  @ApiProperty({
    description: 'Título del papel de trabajo',
    example: 'Política de respaldos firmada',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  title: string

  @ApiProperty({
    description: 'Descripción del contenido/propósito del archivo',
    required: false,
    example:
      'Documento de política de respaldos aprobado por gerencia general',
  })
  @IsOptional()
  @IsString()
  description?: string
}

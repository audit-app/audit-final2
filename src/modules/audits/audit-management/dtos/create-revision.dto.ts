import {
  IsString,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO para crear una auditoría de revisión (follow-up)
 *
 * La auditoría de revisión hereda:
 * - Template del padre
 * - Organización del padre
 * - Framework del padre (si existe)
 *
 * Se incrementa automáticamente el número de revisión.
 */
export class CreateRevisionDto {
  @ApiProperty({
    description:
      'Nombre descriptivo de la revisión (opcional). Si no se proporciona, se genera automáticamente.',
    example: 'Auditoría ISO 27001 - Empresa XYZ Q2 2024 (Revisión 1)',
    required: false,
    minLength: 3,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name?: string

  @ApiProperty({
    description: 'Descripción de la revisión (opcional)',
    example: 'Segunda evaluación de seguimiento de hallazgos anteriores',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({
    description: 'Fecha de inicio planificada para la revisión (opcional)',
    example: '2024-05-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiProperty({
    description: 'Fecha de fin planificada para la revisión (opcional)',
    example: '2024-05-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string

  @ApiProperty({
    description:
      'ID del framework de madurez (opcional). Si no se proporciona, hereda del padre.',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  frameworkId?: string
}

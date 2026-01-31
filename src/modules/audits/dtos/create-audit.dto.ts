import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO para crear una nueva auditoría
 *
 * Requiere seleccionar:
 * - Template (qué se va a auditar)
 * - Organización (a quién se audita)
 * - Framework de madurez (opcional - cómo se califica)
 */
export class CreateAuditDto {
  @ApiProperty({
    description: 'Nombre descriptivo de la auditoría',
    example: 'Auditoría ISO 27001 - Empresa XYZ Q1 2024',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string

  @ApiProperty({
    description: 'Descripción detallada de la auditoría (opcional)',
    example:
      'Evaluación anual de cumplimiento de seguridad de la información según ISO 27001',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({
    description:
      'ID del template base (plantilla de auditoría). Debe estar en estado PUBLISHED.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  templateId: string

  @ApiProperty({
    description: 'ID de la organización a auditar',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  organizationId: string

  @ApiProperty({
    description:
      'ID del framework de madurez a utilizar (opcional). Ej: COBIT 5, CMMI',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  frameworkId?: string

  @ApiProperty({
    description: 'Fecha de inicio planificada (opcional)',
    example: '2024-02-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiProperty({
    description: 'Fecha de fin planificada (opcional)',
    example: '2024-02-28',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string
}

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
 * DTO para actualizar una auditoría existente
 *
 * Solo se pueden actualizar auditorías en estado DRAFT
 */
export class UpdateAuditDto {
  @ApiProperty({
    description: 'Nombre descriptivo de la auditoría',
    example: 'Auditoría ISO 27001 - Empresa XYZ Q1 2024 (Actualizado)',
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
    description: 'Descripción detallada de la auditoría',
    example: 'Evaluación actualizada con nuevo alcance',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({
    description: 'ID del framework de madurez a utilizar',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  frameworkId?: string

  @ApiProperty({
    description: 'Fecha de inicio planificada',
    example: '2024-02-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiProperty({
    description: 'Fecha de fin planificada',
    example: '2024-02-28',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string
}

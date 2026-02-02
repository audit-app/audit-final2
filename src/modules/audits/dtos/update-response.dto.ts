import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  Max,
  IsInt,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { ResponseStatus } from '../enums/response-status.enum'
import { ComplianceLevel } from '../enums/compliance-level.enum'

/**
 * DTO para actualizar una evaluación/respuesta de auditoría
 */
export class UpdateResponseDto {
  @ApiProperty({
    description: 'Estado de la evaluación',
    enum: ResponseStatus,
    required: false,
    example: ResponseStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(ResponseStatus)
  status?: ResponseStatus

  @ApiProperty({
    description:
      'Nivel de madurez alcanzado (según framework). Solo si auditoría tiene framework.',
    required: false,
    minimum: 0,
    maximum: 5,
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  achievedMaturityLevel?: number

  @ApiProperty({
    description: 'Puntuación numérica (0-100)',
    required: false,
    minimum: 0,
    maximum: 100,
    example: 75.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number

  @ApiProperty({
    description: 'Nivel de cumplimiento',
    enum: ComplianceLevel,
    required: false,
    example: ComplianceLevel.PARTIAL,
  })
  @IsOptional()
  @IsEnum(ComplianceLevel)
  complianceLevel?: ComplianceLevel

  @ApiProperty({
    description: 'Hallazgos/Observaciones encontradas durante la evaluación',
    required: false,
    example:
      'No existe política documentada de respaldos. Los respaldos se realizan manualmente sin calendario establecido.',
  })
  @IsOptional()
  @IsString()
  findings?: string

  @ApiProperty({
    description: 'Recomendaciones del auditor para mejorar el cumplimiento',
    required: false,
    example:
      'Crear y publicar política de respaldos. Establecer calendario automático de respaldos.',
  })
  @IsOptional()
  @IsString()
  recommendations?: string

  @ApiProperty({
    description: 'Notas internas del auditor',
    required: false,
    example:
      'Entrevista con TI realizada el 2024-01-15. Revisar en próxima auditoría.',
  })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiProperty({
    description: 'ID del usuario asignado para evaluar este estándar',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string
}

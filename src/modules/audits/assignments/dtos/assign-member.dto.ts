import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsArray,
  IsString,
  ArrayUnique,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { AuditRole } from '../../enums/audit-role.enum'

/**
 * DTO para asignar un miembro al equipo de auditoría
 */
export class AssignMemberDto {
  @ApiProperty({
    description: 'ID del usuario a asignar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string

  @ApiProperty({
    description: 'Rol del miembro en la auditoría',
    enum: AuditRole,
    example: AuditRole.AUDITOR,
  })
  @IsEnum(AuditRole)
  role: AuditRole

  @ApiProperty({
    description:
      'IDs de estándares específicos asignados a este miembro (opcional). Si es null, tiene acceso a todos.',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayUnique()
  assignedStandardIds?: string[]

  @ApiProperty({
    description: 'Notas sobre la asignación (ej: "Responsable de sección A.5")',
    example: 'Experto en controles de acceso',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string
}

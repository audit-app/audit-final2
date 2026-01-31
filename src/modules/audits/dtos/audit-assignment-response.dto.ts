import { ApiProperty } from '@nestjs/swagger'
import { AuditRole } from '../enums/audit-role.enum'

/**
 * DTO de respuesta para una asignación de miembro
 */
export class AuditAssignmentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  auditId: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  userId: string

  @ApiProperty({ enum: AuditRole, example: AuditRole.LEAD_AUDITOR })
  role: AuditRole

  @ApiProperty({
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440003',
      '550e8400-e29b-41d4-a716-446655440004',
    ],
    nullable: true,
  })
  assignedStandardIds: string[] | null

  @ApiProperty({ example: 'Responsable de sección A.5', nullable: true })
  notes: string | null

  @ApiProperty({ example: true })
  isActive: boolean

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440005',
    nullable: true,
  })
  createdBy: string | null

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440005',
    nullable: true,
  })
  updatedBy: string | null
}

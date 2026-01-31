import { ApiProperty } from '@nestjs/swagger'
import { AuditStatus } from '../enums/audit-status.enum'

/**
 * DTO de respuesta para una auditoría
 */
export class AuditResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string

  @ApiProperty({ example: 'AUD-2024-001' })
  code: string

  @ApiProperty({ example: 'Auditoría ISO 27001 - Empresa XYZ Q1 2024' })
  name: string

  @ApiProperty({
    example: 'Evaluación anual de seguridad de información',
    nullable: true,
  })
  description: string | null

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  templateId: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  organizationId: string

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440003',
    nullable: true,
  })
  frameworkId: string | null

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440004',
    nullable: true,
  })
  parentAuditId: string | null

  @ApiProperty({ example: 0 })
  revisionNumber: number

  @ApiProperty({ enum: AuditStatus, example: AuditStatus.DRAFT })
  status: AuditStatus

  @ApiProperty({ example: '2024-02-01T00:00:00.000Z', nullable: true })
  startDate: Date | null

  @ApiProperty({ example: '2024-02-28T23:59:59.999Z', nullable: true })
  endDate: Date | null

  @ApiProperty({ example: '2024-02-01T09:00:00.000Z', nullable: true })
  actualStartDate: Date | null

  @ApiProperty({ example: '2024-02-28T18:00:00.000Z', nullable: true })
  closedAt: Date | null

  @ApiProperty({ example: null, nullable: true })
  overallScore: number | null

  @ApiProperty({ example: null, nullable: true })
  maturityLevel: number | null

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

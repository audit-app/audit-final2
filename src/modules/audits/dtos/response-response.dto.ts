import { ApiProperty } from '@nestjs/swagger'
import { ResponseStatus } from '../enums/response-status.enum'
import { ComplianceLevel } from '../enums/compliance-level.enum'
import { WorkPaperResponseDto } from './work-paper-response.dto'

/**
 * Información básica del estándar (para evitar circular dependency)
 */
export class StandardInfoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string

  @ApiProperty({ example: 'A.5.1.1' })
  code: string

  @ApiProperty({ example: 'Políticas para la seguridad de la información' })
  title: string

  @ApiProperty({
    example: 'Se debe definir un conjunto de políticas...',
    nullable: true
  })
  description: string | null

  @ApiProperty({ example: true })
  isAuditable: boolean

  @ApiProperty({ example: 1 })
  level: number

  @ApiProperty({ example: 15.5, description: 'Peso del estándar' })
  weight: number

  @ApiProperty({
    example: 'Verificar política documentada y firmada',
    nullable: true,
    description: 'Guía para el auditor'
  })
  auditorGuidance: string | null
}

/**
 * DTO de respuesta para una evaluación de auditoría
 */
export class ResponseResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  auditId: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  standardId: string

  @ApiProperty({
    type: StandardInfoDto,
    description: 'Información del estándar evaluado'
  })
  standard?: StandardInfoDto

  @ApiProperty({
    example: 15.5,
    description: 'Peso del estándar en la evaluación',
  })
  weight: number

  @ApiProperty({
    enum: ResponseStatus,
    example: ResponseStatus.IN_PROGRESS,
  })
  status: ResponseStatus

  @ApiProperty({
    example: 3,
    nullable: true,
    description: 'Nivel de madurez alcanzado (0-5 según framework)',
  })
  achievedMaturityLevel: number | null

  @ApiProperty({
    example: 75.5,
    nullable: true,
    description: 'Puntuación 0-100',
  })
  score: number | null

  @ApiProperty({
    enum: ComplianceLevel,
    example: ComplianceLevel.PARTIAL,
    nullable: true,
  })
  complianceLevel: ComplianceLevel | null

  @ApiProperty({
    example:
      'No existe política documentada de respaldos. Los respaldos se realizan manualmente.',
    nullable: true,
  })
  findings: string | null

  @ApiProperty({
    example: 'Crear y publicar política de respaldos.',
    nullable: true,
  })
  recommendations: string | null

  @ApiProperty({
    example: 'Entrevista con TI realizada el 2024-01-15.',
    nullable: true,
  })
  notes: string | null

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440003',
    nullable: true,
  })
  assignedUserId: string | null

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440004',
    nullable: true,
  })
  reviewedBy: string | null

  @ApiProperty({ example: '2024-01-20T15:30:00Z', nullable: true })
  reviewedAt: Date | null

  @ApiProperty({
    type: [WorkPaperResponseDto],
    description: 'Papeles de trabajo adjuntos',
  })
  workPapers?: WorkPaperResponseDto[]

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: Date

  @ApiProperty({ example: '2024-01-15T14:30:00Z' })
  updatedAt: Date

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440005' })
  createdBy: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440005' })
  updatedBy: string
}

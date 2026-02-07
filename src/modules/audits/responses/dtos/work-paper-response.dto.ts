import { ApiProperty } from '@nestjs/swagger'
import { WorkPaperType } from '../../enums/work-paper-type.enum'

/**
 * DTO de respuesta para un papel de trabajo
 */
export class WorkPaperResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  responseId: string

  @ApiProperty({ example: 'Política de respaldos firmada' })
  title: string

  @ApiProperty({
    example: 'Documento de política de respaldos aprobado por gerencia general',
    nullable: true,
  })
  description: string | null

  @ApiProperty({ example: 'uploads/audits/2024/politica-respaldos.pdf' })
  filePath: string

  @ApiProperty({ example: 'politica-respaldos.pdf' })
  fileName: string

  @ApiProperty({ example: 245760, description: 'Tamaño en bytes' })
  fileSize: number

  @ApiProperty({ example: '240.00 KB' })
  fileSizeFormatted: string

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string

  @ApiProperty({ enum: WorkPaperType, example: WorkPaperType.DOCUMENT })
  type: WorkPaperType

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  uploadedBy: string

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  uploadedAt: Date

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date
}

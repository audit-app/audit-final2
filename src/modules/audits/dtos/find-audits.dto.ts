import { IsOptional, IsEnum, IsUUID, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { PaginationDto } from '@core/dtos'
import { AuditStatus } from '../enums/audit-status.enum'

/**
 * DTO para buscar y filtrar auditorías
 */
export class FindAuditsDto extends PaginationDto {
  @ApiProperty({
    description: 'Texto de búsqueda (busca en código, nombre y descripción)',
    required: false,
    example: 'ISO 27001',
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({
    description: 'Filtrar por estado de la auditoría',
    enum: AuditStatus,
    required: false,
    example: AuditStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(AuditStatus)
  status?: AuditStatus

  @ApiProperty({
    description: 'Filtrar por ID de organización',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string

  @ApiProperty({
    description: 'Filtrar por ID de template',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  templateId?: string

  @ApiProperty({
    description: 'Filtrar por ID de framework',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  frameworkId?: string

  @ApiProperty({
    description:
      'Filtrar por ID de auditoría padre (para ver revisiones de una auditoría específica)',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsOptional()
  @IsUUID()
  parentAuditId?: string

  @ApiProperty({
    description:
      'Filtrar solo auditorías iniciales (sin padre) o solo revisiones (con padre). "initial" = solo iniciales, "revision" = solo revisiones',
    required: false,
    enum: ['initial', 'revision'],
    example: 'initial',
  })
  @IsOptional()
  @IsString()
  revisionType?: 'initial' | 'revision'
}

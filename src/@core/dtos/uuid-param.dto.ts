import { IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO para validar parámetros UUID en rutas
 *
 * Uso:
 * ```typescript
 * @Get(':id')
 * async findOne(@Param() { id }: UuidParamDto) {
 *   // id está validado como UUID
 * }
 * ```
 */
export class UuidParamDto {
  @ApiProperty({
    description: 'UUID del recurso',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'El ID debe ser un UUID válido' })
  id: string
}

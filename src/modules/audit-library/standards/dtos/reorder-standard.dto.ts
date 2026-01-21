import { IsInt, Min } from '@core/i18n'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO para reordenar un standard (drag & drop)
 *
 * Permite cambiar el orden de visualización de un standard
 * entre sus hermanos (mismo parentId)
 */
export class ReorderStandardDto {
  @ApiProperty({
    description: 'Nuevo orden de visualización (posición entre hermanos)',
    example: 3,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  newOrder: number
}

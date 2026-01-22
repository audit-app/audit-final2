import { IsBoolean } from '@core/i18n'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO para activar/desactivar si un standard es auditable
 *
 * Permite marcar un standard como:
 * - true: Control auditable (específico, evaluable)
 * - false: Agrupador organizacional (solo título/sección)
 */
export class ToggleAuditableDto {
  @ApiProperty({
    description:
      'Indica si el standard es auditable (true) o solo organizacional (false)',
    example: true,
  })
  @IsBoolean()
  isAuditable: boolean
}

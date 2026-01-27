import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO estándar para respuestas simples con solo un mensaje
 *
 * Útil para endpoints que solo confirman una operación sin retornar datos adicionales.
 * Este DTO representa el contenido del campo 'data' en la respuesta envuelta por TransformInterceptor.
 *
 * @example
 * ```json
 * {
 *   "message": "Operación completada exitosamente"
 * }
 * ```
 */
export class MessageResponseDto {
  @ApiProperty({
    description: 'Mensaje descriptivo de la operación',
    example: 'Operación completada exitosamente',
  })
  message: string
}

/**
 * DTO para respuestas que incluyen un mensaje y un contador
 *
 * Útil para operaciones que afectan múltiples registros (revocaciones masivas, eliminaciones, etc).
 * Este DTO representa el contenido del campo 'data' en la respuesta envuelta por TransformInterceptor.
 *
 * @example
 * ```json
 * {
 *   "message": "Todas las sesiones han sido cerradas",
 *   "count": 5
 * }
 * ```
 */
export class MessageWithCountResponseDto {
  @ApiProperty({
    description: 'Mensaje descriptivo de la operación',
    example: 'Todas las sesiones han sido cerradas',
  })
  message: string

  @ApiProperty({
    description: 'Cantidad de registros afectados',
    example: 5,
  })
  count: number
}

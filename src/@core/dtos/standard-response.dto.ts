import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO de Swagger para documentar la estructura estándar de respuestas exitosas de la API
 *
 * Este DTO representa el formato generado automáticamente por el TransformInterceptor.
 * NO se usa en código - solo para documentación de Swagger.
 *
 * NOTA: En endpoints que usan @ResponseMessage, el campo 'message' tendrá el valor personalizado.
 *
 * @example
 * ```json
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Operación exitosa",
 *   "data": null,
 *   "timestamp": "2024-01-17T10:30:00.000Z"
 * }
 * ```
 */
export class ApiStandardResponseDto {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  success: boolean

  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 200,
  })
  statusCode: number

  @ApiProperty({
    description:
      'Mensaje descriptivo de la operación. Se genera automáticamente según el método HTTP o se personaliza con @ResponseMessage',
    example: 'Operación exitosa',
  })
  message: string

  @ApiProperty({
    description:
      'Datos de la operación. Será null si el endpoint no retorna datos.',
    example: null,
    nullable: true,
    required: false,
  })
  data?: any

  @ApiProperty({
    description: 'Timestamp de cuando se generó la respuesta',
    example: '2024-01-17T10:30:00.000Z',
  })
  timestamp: string
}

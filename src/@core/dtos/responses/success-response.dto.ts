import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO estándar para respuestas exitosas de la API
 *
 * Este DTO es el ÚNICO PUNTO DE VERDAD para respuestas exitosas.
 * Es usado por:
 * - TransformInterceptor (genera la respuesta)
 * - Swagger (documenta la respuesta)
 * - Controllers (tipo de retorno)
 *
 * @template T Tipo de datos que contiene la respuesta
 *
 * @example
 * ```json
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Usuario creado exitosamente",
 *   "data": { "id": "123", "name": "John" },
 *   "timestamp": "2024-01-30T10:30:00.000Z"
 * }
 * ```
 */
export class SuccessResponseDto<T = any> {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
    default: true,
  })
  success: boolean

  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 200,
    enum: [200, 201, 204],
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
    required: false,
    nullable: true,
  })
  data?: T | null

  @ApiProperty({
    description: 'Timestamp ISO 8601 de cuando se generó la respuesta',
    example: '2024-01-30T10:30:00.000Z',
  })
  timestamp: string
}

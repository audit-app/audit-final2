import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO estándar para respuestas de error de la API
 *
 * Este DTO es el ÚNICO PUNTO DE VERDAD para respuestas de error.
 * Es usado por:
 * - HttpExceptionFilter (genera respuestas de error)
 * - Swagger (documenta respuestas de error)
 * - Validaciones (class-validator errors)
 *
 * @example Error Simple
 * ```json
 * {
 *   "success": false,
 *   "statusCode": 404,
 *   "message": "Usuario no encontrado",
 *   "error": "Not Found",
 *   "timestamp": "2024-01-30T10:30:00.000Z",
 *   "path": "/api/users/123",
 *   "method": "GET"
 * }
 * ```
 *
 * @example Error de Validación
 * ```json
 * {
 *   "success": false,
 *   "statusCode": 400,
 *   "message": ["email debe ser un email válido", "password es requerido"],
 *   "error": "Bad Request",
 *   "validationErrors": {
 *     "email": ["debe ser un email válido"],
 *     "password": ["es requerido"]
 *   },
 *   "timestamp": "2024-01-30T10:30:00.000Z",
 *   "path": "/api/auth/login",
 *   "method": "POST"
 * }
 * ```
 */
export class ErrorResponseDto {
  @ApiProperty({
    description:
      'Indica si la operación fue exitosa (siempre false para errores)',
    example: false,
    default: false,
  })
  success: boolean

  @ApiProperty({
    description: 'Código de estado HTTP del error',
    example: 400,
    enum: [400, 401, 403, 404, 409, 422, 500],
  })
  statusCode: number

  @ApiProperty({
    description:
      'Mensaje de error. Puede ser un string simple o array de strings para errores de validación',
    oneOf: [
      { type: 'string', example: 'Usuario no encontrado' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['email debe ser un email válido', 'password es requerido'],
      },
    ],
  })
  message: string | string[]

  @ApiProperty({
    description: 'Nombre del error HTTP',
    example: 'Bad Request',
    enum: [
      'Bad Request',
      'Unauthorized',
      'Forbidden',
      'Not Found',
      'Conflict',
      'Unprocessable Entity',
      'Internal Server Error',
    ],
  })
  error: string

  @ApiProperty({
    description:
      'Array de errores adicionales (usado en errores de importación masiva, etc.)',
    required: false,
    type: 'array',
    items: { type: 'object' },
  })
  errors?: unknown[]

  @ApiProperty({
    description:
      'Errores de validación agrupados por campo (generado por class-validator)',
    required: false,
    type: Object,
    example: {
      email: ['debe ser un email válido'],
      password: ['es requerido', 'debe tener al menos 8 caracteres'],
    },
  })
  validationErrors?: Record<string, unknown>

  @ApiProperty({
    description: 'Resumen de errores (usado en operaciones batch)',
    required: false,
    type: Object,
  })
  summary?: Record<string, unknown>

  @ApiProperty({
    description: 'Número total de errores encontrados',
    required: false,
    example: 5,
  })
  totalErrors?: number

  @ApiProperty({
    description: 'Detalles adicionales del error (solo en desarrollo)',
    required: false,
    type: Object,
  })
  details?: unknown

  @ApiProperty({
    description: 'Timestamp ISO 8601 de cuando ocurrió el error',
    example: '2024-01-30T10:30:00.000Z',
  })
  timestamp: string

  @ApiProperty({
    description: 'Ruta del endpoint que generó el error',
    required: false,
    example: '/api/users/123',
  })
  path?: string

  @ApiProperty({
    description: 'Método HTTP que generó el error',
    required: false,
    example: 'POST',
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
  method?: string
}

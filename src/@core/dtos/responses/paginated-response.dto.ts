import { ApiProperty } from '@nestjs/swagger'
import type { PaginationMeta } from '../paginated-response.dto'

/**
 * Clase de metadata de paginación para Swagger
 * (Re-implementada como clase para soportar decoradores)
 */
export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({ description: 'Número total de registros', example: 100 })
  total: number

  @ApiProperty({ description: 'Página actual', example: 1 })
  page: number

  @ApiProperty({ description: 'Registros por página', example: 10 })
  limit: number

  @ApiProperty({ description: 'Número total de páginas', example: 10 })
  totalPages: number

  @ApiProperty({
    description: 'Indica si hay una página siguiente',
    example: true,
  })
  hasNextPage: boolean

  @ApiProperty({
    description: 'Indica si hay una página anterior',
    example: false,
  })
  hasPrevPage: boolean
}

/**
 * DTO estándar para respuestas paginadas de la API
 *
 * Este DTO es el ÚNICO PUNTO DE VERDAD para respuestas paginadas.
 * Es usado por:
 * - TransformInterceptor (detecta paginación y genera la respuesta)
 * - Swagger (documenta la respuesta paginada)
 * - Controllers (tipo de retorno para listados)
 *
 * @template T Tipo de elementos en el array de datos
 *
 * @example
 * ```json
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Operación exitosa",
 *   "data": [{ "id": "1" }, { "id": "2" }],
 *   "meta": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 50,
 *     "totalPages": 5
 *   },
 *   "timestamp": "2024-01-30T10:30:00.000Z"
 * }
 * ```
 */
export class PaginatedResponseDto<T = any> {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
    default: true,
  })
  success: boolean

  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 200,
  })
  statusCode: number

  @ApiProperty({
    description: 'Mensaje descriptivo de la operación',
    example: 'Operación exitosa',
  })
  message: string

  @ApiProperty({
    description: 'Array de elementos de la página actual',
    type: 'array',
    isArray: true,
  })
  data: T[]

  @ApiProperty({
    description: 'Metadatos de paginación',
    type: () => PaginationMetaDto,
  })
  meta: PaginationMeta

  @ApiProperty({
    description: 'Timestamp ISO 8601 de cuando se generó la respuesta',
    example: '2024-01-30T10:30:00.000Z',
  })
  timestamp: string
}

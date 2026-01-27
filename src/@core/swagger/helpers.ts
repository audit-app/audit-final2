import { Type, applyDecorators, HttpStatus } from '@nestjs/common'
import { ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger'
import { ApiStandardResponseDto, MessageResponseDto } from '@core/dtos'

/**
 * Configuración para respuestas envueltas de Swagger
 */
interface ApiWrappedResponseOptions {
  /** Código de estado HTTP */
  status: number
  /** Descripción de la respuesta */
  description: string
  /** DTO del contenido de 'data' (opcional, para respuestas sin data) */
  type?: Type<any>
  /** Si es un array */
  isArray?: boolean
}

/**
 * Decorador helper para documentar respuestas envueltas por TransformInterceptor
 *
 * Genera automáticamente la estructura:
 * ```json
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "...",
 *   "data": { ... },  // ← El tipo especificado en 'type'
 *   "timestamp": "2024-01-17T10:30:00.000Z"
 * }
 * ```
 *
 * @param options - Configuración de la respuesta
 * @returns Decorador de Swagger configurado
 *
 * @example
 * ```typescript
 * // Respuesta con DTO
 * @ApiWrappedResponse({
 *   status: 200,
 *   description: 'Usuario obtenido exitosamente',
 *   type: UserResponseDto
 * })
 *
 * // Respuesta con array
 * @ApiWrappedResponse({
 *   status: 200,
 *   description: 'Lista de sesiones',
 *   type: SessionResponseDto,
 *   isArray: true
 * })
 *
 * // Respuesta sin data (solo message)
 * @ApiWrappedResponse({
 *   status: 204,
 *   description: 'Operación exitosa sin contenido'
 * })
 * ```
 */
export function ApiWrappedResponse(options: ApiWrappedResponseOptions) {
  const { status, description, type, isArray = false } = options

  // Si no hay type, significa que data es null o el DTO es simple (message)
  if (!type) {
    return applyDecorators(
      ApiExtraModels(ApiStandardResponseDto),
      ApiResponse({
        status,
        description,
        schema: {
          allOf: [
            { $ref: getSchemaPath(ApiStandardResponseDto) },
            {
              properties: {
                data: {
                  type: 'null',
                  example: null,
                },
              },
            },
          ],
        },
      }),
    )
  }

  // Si hay type, documentamos el campo 'data' con el tipo especificado
  return applyDecorators(
    ApiExtraModels(ApiStandardResponseDto, type),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiStandardResponseDto) },
          {
            properties: {
              data: isArray
                ? {
                    type: 'array',
                    items: { $ref: getSchemaPath(type) },
                  }
                : {
                    $ref: getSchemaPath(type),
                  },
            },
          },
        ],
      },
    }),
  )
}

/**
 * Decorador helper para documentar respuestas con solo un mensaje
 *
 * Equivalente a usar ApiWrappedResponse con MessageResponseDto, pero más conciso.
 *
 * Genera la estructura:
 * ```json
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Operación exitosa",
 *   "data": {
 *     "message": "Detalle adicional de la operación"
 *   },
 *   "timestamp": "2024-01-17T10:30:00.000Z"
 * }
 * ```
 *
 * @param status - Código de estado HTTP
 * @param description - Descripción de la respuesta
 * @param exampleMessage - Ejemplo del mensaje en 'data'
 * @returns Decorador de Swagger configurado
 *
 * @example
 * ```typescript
 * @ApiMessageResponse(200, 'Contraseña actualizada', 'Contraseña actualizada exitosamente')
 * ```
 */
export function ApiMessageResponse(
  status: number,
  description: string,
  exampleMessage?: string,
) {
  return applyDecorators(
    ApiExtraModels(ApiStandardResponseDto),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiStandardResponseDto) },
          {
            properties: {
              data: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: exampleMessage || description,
                  },
                },
              },
            },
          },
        ],
      },
    }),
  )
}

/**
 * Decorador para documentar respuestas de creación (201)
 */
export function ApiCreate(
  type: Type<any>,
  descriptionOrOptions?:
    | string
    | { summary?: string; description?: string; [key: string]: any },
  _deprecated?: any,
) {
  const description =
    typeof descriptionOrOptions === 'string'
      ? descriptionOrOptions
      : descriptionOrOptions?.description || 'Recurso creado exitosamente'

  return ApiWrappedResponse({
    status: HttpStatus.CREATED,
    description,
    type,
  })
}

/**
 * Decorador para documentar respuestas de listado (200) con arrays
 */
export function ApiList(
  type: Type<any>,
  descriptionOrOptions?:
    | string
    | { summary?: string; description?: string; [key: string]: any },
  _deprecated?: any,
) {
  const description =
    typeof descriptionOrOptions === 'string'
      ? descriptionOrOptions
      : descriptionOrOptions?.description || 'Lista de recursos obtenida exitosamente'

  return ApiWrappedResponse({
    status: HttpStatus.OK,
    description,
    type,
    isArray: true,
  })
}

/**
 * Decorador para documentar respuestas de búsqueda por ID (200)
 */
export function ApiFindOne(
  type: Type<any>,
  descriptionOrOptions?:
    | string
    | { summary?: string; description?: string; [key: string]: any },
  _deprecated?: any,
) {
  const description =
    typeof descriptionOrOptions === 'string'
      ? descriptionOrOptions
      : descriptionOrOptions?.description || 'Recurso encontrado exitosamente'

  return applyDecorators(
    ApiWrappedResponse({
      status: HttpStatus.OK,
      description,
      type,
    }),
    ApiWrappedResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Recurso no encontrado',
    }),
  )
}

/**
 * Decorador para documentar respuestas de actualización (200) con mensaje
 */
export function ApiUpdateWithMessage(
  descriptionOrOptions?:
    | string
    | { summary?: string; description?: string; [key: string]: any },
) {
  const description =
    typeof descriptionOrOptions === 'string'
      ? descriptionOrOptions
      : descriptionOrOptions?.description || 'Recurso actualizado exitosamente'

  return ApiWrappedResponse({
    status: HttpStatus.OK,
    description,
    type: MessageResponseDto,
  })
}

/**
 * Decorador para documentar respuestas de eliminación (200) con mensaje
 */
export function ApiRemoveWithMessage(
  descriptionOrOptions?:
    | string
    | { summary?: string; description?: string; [key: string]: any },
) {
  const description =
    typeof descriptionOrOptions === 'string'
      ? descriptionOrOptions
      : descriptionOrOptions?.description || 'Recurso eliminado exitosamente'

  return ApiWrappedResponse({
    status: HttpStatus.OK,
    description,
    type: MessageResponseDto,
  })
}

/**
 * Decorador para documentar respuestas de eliminación (204) sin contenido
 */
export function ApiRemoveNoContent(
  descriptionOrOptions?:
    | string
    | { summary?: string; description?: string; [key: string]: any },
) {
  const description =
    typeof descriptionOrOptions === 'string'
      ? descriptionOrOptions
      : descriptionOrOptions?.description || 'Recurso eliminado exitosamente'

  return ApiWrappedResponse({
    status: HttpStatus.NO_CONTENT,
    description,
  })
}

/**
 * Decorador alias para ApiWrappedResponse con status 200
 */
export function ApiOkResponse(
  type: Type<any>,
  descriptionOrOptions?:
    | string
    | { summary?: string; description?: string; [key: string]: any },
  _deprecated?: any,
) {
  const description =
    typeof descriptionOrOptions === 'string'
      ? descriptionOrOptions
      : descriptionOrOptions?.description || 'Operación exitosa'

  return ApiWrappedResponse({
    status: HttpStatus.OK,
    description,
    type,
  })
}

/**
 * Decorador para documentar respuestas 404
 */
export function ApiNotFoundResponse(description?: string) {
  return ApiWrappedResponse({
    status: HttpStatus.NOT_FOUND,
    description: description || 'Recurso no encontrado',
  })
}

/**
 * Decorador combinado para documentar respuestas estándar (200, 400, 404)
 */
export function ApiStandardResponses(
  typeOrOptions?: Type<any> | { exclude?: number[]; [key: string]: any },
) {
  // Si es un tipo (clase), úsalo directamente
  const isType =
    typeof typeOrOptions === 'function' ||
    (typeOrOptions && 'prototype' in typeOrOptions)
  const type = isType ? (typeOrOptions as Type<any>) : undefined
  const exclude = !isType
    ? (typeOrOptions as { exclude?: number[] })?.exclude || []
    : []

  const decorators: Array<ReturnType<typeof ApiWrappedResponse>> = []

  // 200 OK
  if (!exclude.includes(200) && type) {
    decorators.push(
      ApiWrappedResponse({
        status: HttpStatus.OK,
        description: 'Operación exitosa',
        type,
      }),
    )
  }

  // 400 Bad Request
  if (!exclude.includes(400)) {
    decorators.push(
      ApiWrappedResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Solicitud incorrecta',
      }),
    )
  }

  // 404 Not Found
  if (!exclude.includes(404)) {
    decorators.push(
      ApiWrappedResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Recurso no encontrado',
      }),
    )
  }

  return applyDecorators(...decorators)
}

/**
 * Decoradores compuestos para operaciones CRUD
 *
 * Enfoque profesional: Un decorador por operación que incluye TODO lo necesario
 */

import { applyDecorators, Type, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUpdatedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiStandardResponses,
  ApiPaginatedResponse,
} from './api-responses.decorator'
import { buildPaginatedOperation } from '../helpers/api-operation.helper'
import { SuccessResponseDto } from '@core/dtos'

interface CrudOperationOptions<T> {
  /** Tipo de respuesta (DTO) */
  type: Type<T>
  /** Resumen personalizado (opcional) */
  summary?: string
  /** Descripción personalizada (opcional) */
  description?: string
  /** Mensaje de conflicto personalizado para Create/Update */
  conflictMessage?: string
}

interface ListOperationOptions<T> {
  /** Tipo de respuesta (DTO) */
  type: Type<T>
  /** Resumen personalizado (opcional) */
  summary?: string
  /** Campos en los que busca el parámetro 'search' */
  searchFields: string[]
  /** Campos ordenables */
  sortableFields: string[]
  /** Campo de ordenamiento por defecto */
  defaultSortBy?: string
  /** Filtros personalizados */
  filterFields?: Array<{
    name: string
    description: string
    type?: string
    example?: any
  }>
}

/**
 * Decorador para endpoint POST (Create)
 *
 * Incluye:
 * - @HttpCode(201)
 * - @ApiOperation con descripción estándar
 * - @ApiCreatedResponse con el tipo
 * - @ApiConflictResponse
 * - Respuestas estándar (400, 401, 403, 500)
 *
 * @example
 * ```typescript
 * @Post()
 * @ApiCreate(UserResponseDto, {
 *   summary: 'Crear usuario',
 *   conflictMessage: 'Email ya existe',
 * })
 * async create(@Body() dto: CreateUserDto) {}
 * ```
 */
export function ApiCreate<T>(
  type: Type<T>,
  options?: Omit<CrudOperationOptions<T>, 'type'>,
) {
  const summary =
    options?.summary ||
    `Crear ${type.name.replace('ResponseDto', '').replace('Dto', '')}`
  const description =
    options?.description ||
    'Crea un nuevo recurso y lo retorna con sus datos completos.'
  const conflictMessage = options?.conflictMessage || 'El recurso ya existe'

  return applyDecorators(
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary, description }),
    ApiCreatedResponse(type, 'Recurso creado exitosamente'),
    ApiConflictResponse(conflictMessage),
    ApiStandardResponses(),
  )
}

/**
 * Decorador para endpoint GET con paginación (List)
 *
 * Incluye:
 * - @ApiOperation con descripción generada automáticamente
 * - @ApiPaginatedResponse
 * - Respuestas estándar
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiList(UserResponseDto, {
 *   summary: 'Listar usuarios',
 *   searchFields: USER_SEARCH_FIELDS,
 *   sortableFields: USER_SORTABLE_FIELDS,
 *   filterFields: [
 *     { name: 'status', description: 'Filtrar por estado', type: 'enum: active, inactive' },
 *   ],
 * })
 * async findAll(@Query() dto: FindUsersDto) {}
 * ```
 */
export function ApiList<T>(
  type: Type<T>,
  options: Omit<ListOperationOptions<T>, 'type'>,
) {
  const summary =
    options.summary ||
    `Listar ${type.name.replace('ResponseDto', '').replace('Dto', '')}s`

  return applyDecorators(
    ApiOperation(
      buildPaginatedOperation({
        summary,
        searchFields: options.searchFields,
        sortableFields: options.sortableFields,
        defaultSortBy: options.defaultSortBy || 'createdAt',
        filterFields: options.filterFields || [],
      }),
    ),
    ApiPaginatedResponse(type),
    ApiStandardResponses(),
  )
}

/**
 * Decorador para endpoint GET /:id (FindOne)
 *
 * Incluye:
 * - @ApiOperation
 * - @ApiOkResponse
 * - @ApiNotFoundResponse
 * - Respuestas estándar
 *
 * @example
 * ```typescript
 * @Get(':id')
 * @ApiFindOne(UserResponseDto)
 * async findOne(@Param() { id }: UuidParamDto) {}
 * ```
 */
export function ApiFindOne<T>(
  type: Type<T>,
  options?: Omit<CrudOperationOptions<T>, 'type'>,
) {
  const resourceName = type.name
    .replace('ResponseDto', '')
    .replace('Dto', '')
    .toLowerCase()
  const summary = options?.summary || `Obtener ${resourceName} por ID`
  const description =
    options?.description ||
    `Retorna los datos completos de un ${resourceName} específico mediante su ID único.`

  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiOkResponse(type, 'Recurso encontrado exitosamente'),
    ApiNotFoundResponse('Recurso no encontrado'),
    ApiStandardResponses({ exclude: [400] }), // GET /:id solo valida UUID, no body
  )
}

/**
 * Decorador para endpoint PATCH /:id (Update)
 *
 * Incluye:
 * - @ApiOperation
 * - @ApiUpdatedResponse
 * - @ApiNotFoundResponse
 * - @ApiConflictResponse (opcional)
 * - Respuestas estándar
 *
 * @example
 * ```typescript
 * @Patch(':id')
 * @ApiUpdate(UserResponseDto, {
 *   conflictMessage: 'Email ya existe',
 * })
 * async update(@Param() { id }: UuidParamDto, @Body() dto: UpdateUserDto) {}
 * ```
 */
export function ApiUpdate<T>(
  type: Type<T>,
  options?: Omit<CrudOperationOptions<T>, 'type'>,
) {
  const resourceName = type.name
    .replace('ResponseDto', '')
    .replace('Dto', '')
    .toLowerCase()
  const summary = options?.summary || `Actualizar ${resourceName}`
  const description =
    options?.description ||
    `Actualiza los datos de un ${resourceName} y retorna la entidad actualizada.`

  const decorators = [
    ApiOperation({ summary, description }),
    ApiUpdatedResponse(type, 'Recurso actualizado exitosamente'),
    ApiNotFoundResponse('Recurso no encontrado'),
    ApiStandardResponses(),
  ]

  if (options?.conflictMessage) {
    decorators.splice(2, 0, ApiConflictResponse(options.conflictMessage))
  }

  return applyDecorators(...decorators)
}

/**
 * Decorador para endpoint DELETE /:id (Remove)
 *
 * Incluye:
 * - @HttpCode(200)
 * - @ApiOperation
 * - @ApiOkResponse (retorna el recurso eliminado)
 * - @ApiNotFoundResponse
 * - @ApiConflictResponse (opcional)
 * - Respuestas estándar
 *
 * @example
 * ```typescript
 * @Delete(':id')
 * @ApiRemove(UserResponseDto, {
 *   summary: 'Eliminar usuario (soft delete)',
 *   description: 'Marca el usuario como eliminado sin borrar sus datos.',
 * })
 * async remove(@Param() { id }: UuidParamDto) {}
 * ```
 */
export function ApiRemove<T>(
  type: Type<T>,
  options?: Omit<CrudOperationOptions<T>, 'type'>,
) {
  const resourceName = type.name
    .replace('ResponseDto', '')
    .replace('Dto', '')
    .toLowerCase()
  const summary = options?.summary || `Eliminar ${resourceName} (soft delete)`
  const description =
    options?.description ||
    `Marca el ${resourceName} como eliminado sin borrar sus datos. Retorna el recurso eliminado para confirmación.`

  const decorators = [
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary, description }),
    ApiOkResponse(type, 'Recurso eliminado exitosamente'),
    ApiNotFoundResponse('Recurso no encontrado'),
    ApiStandardResponses(),
  ]

  if (options?.conflictMessage) {
    decorators.splice(3, 0, ApiConflictResponse(options.conflictMessage))
  }

  return applyDecorators(...decorators)
}

/**
 * Decorador para endpoints personalizados simples
 *
 * @example
 * ```typescript
 * @Patch(':id/activate')
 * @ApiCustom(UserResponseDto, {
 *   summary: 'Activar usuario',
 *   description: 'Cambia el estado del usuario a ACTIVE',
 * })
 * async activate(@Param() { id }: UuidParamDto) {}
 * ```
 */
export function ApiCustom<T>(
  type: Type<T>,
  options: {
    summary: string
    description?: string
    notFound?: boolean
    conflict?: string
  },
) {
  const decorators = [
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: options.summary,
      description: options.description || options.summary,
    }),
    ApiOkResponse(type, 'Operación exitosa'),
    ApiStandardResponses(),
  ]

  if (options.notFound !== false) {
    decorators.splice(3, 0, ApiNotFoundResponse('Recurso no encontrado'))
  }

  if (options.conflict) {
    decorators.splice(3, 0, ApiConflictResponse(options.conflict))
  }

  return applyDecorators(...decorators)
}

/**
 * Decorador para endpoint PATCH /:id (Update) con mensaje genérico
 *
 * Similar a @ApiUpdate pero devuelve un mensaje de éxito en lugar de la entidad.
 *
 * Incluye:
 * - @HttpCode(200)
 * - @ApiOperation
 * - @ApiOkResponse con StandardResponseDto
 * - @ApiNotFoundResponse
 * - @ApiConflictResponse (opcional)
 * - Respuestas estándar
 *
 * @example
 * ```typescript
 * @Patch(':id')
 * @ApiUpdateWithMessage({
 *   summary: 'Actualizar usuario',
 *   conflictMessage: 'Email ya existe',
 * })
 * async update(@Param() { id }: UuidParamDto, @Body() dto: UpdateUserDto) {
 *   await this.updateUseCase.execute(id, dto)
 *   return { message: 'Usuario actualizado exitosamente' }
 * }
 * ```
 */
export function ApiUpdateWithMessage(options?: {
  summary?: string
  description?: string
  conflictMessage?: string
}) {
  const summary = options?.summary || 'Actualizar recurso'
  const description =
    options?.description ||
    'Actualiza los datos del recurso y retorna un mensaje de confirmación.'

  const decorators = [
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary, description }),
    ApiOkResponse(SuccessResponseDto, 'Recurso actualizado exitosamente'),
    ApiNotFoundResponse('Recurso no encontrado'),
    ApiStandardResponses(),
  ]

  if (options?.conflictMessage) {
    decorators.splice(3, 0, ApiConflictResponse(options.conflictMessage))
  }

  return applyDecorators(...decorators)
}

/**
 * Decorador para endpoint DELETE /:id (Remove) con mensaje genérico
 *
 * Similar a @ApiRemove pero devuelve un mensaje de éxito en lugar de la entidad.
 *
 * Incluye:
 * - @HttpCode(200)
 * - @ApiOperation
 * - @ApiOkResponse con StandardResponseDto
 * - @ApiNotFoundResponse
 * - @ApiConflictResponse (opcional)
 * - Respuestas estándar
 *
 * @example
 * ```typescript
 * @Delete(':id')
 * @ApiRemoveWithMessage({
 *   summary: 'Eliminar usuario (soft delete)',
 * })
 * async remove(@Param() { id }: UuidParamDto) {
 *   await this.removeUseCase.execute(id)
 *   return { message: 'Usuario eliminado exitosamente' }
 * }
 * ```
 */
export function ApiRemoveWithMessage(options?: {
  summary?: string
  description?: string
  conflictMessage?: string
}) {
  const summary = options?.summary || 'Eliminar recurso'
  const description =
    options?.description ||
    'Elimina el recurso y retorna un mensaje de confirmación.'

  const decorators = [
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary, description }),
    ApiOkResponse(SuccessResponseDto, 'Recurso eliminado exitosamente'),
    ApiNotFoundResponse('Recurso no encontrado'),
    ApiStandardResponses(),
  ]

  if (options?.conflictMessage) {
    decorators.splice(3, 0, ApiConflictResponse(options.conflictMessage))
  }

  return applyDecorators(...decorators)
}

/**
 * Decorador para endpoint DELETE /:id con status 204 No Content
 *
 * Estándar REST puro: elimina el recurso sin devolver cuerpo.
 *
 * Incluye:
 * - @HttpCode(204)
 * - @ApiOperation
 * - @ApiResponse con status 204
 * - @ApiNotFoundResponse
 * - @ApiConflictResponse (opcional)
 * - Respuestas estándar
 *
 * @example
 * ```typescript
 * @Delete(':id')
 * @ApiRemoveNoContent({
 *   summary: 'Eliminar usuario (soft delete)',
 * })
 * async remove(@Param() { id }: UuidParamDto) {
 *   await this.removeUseCase.execute(id)
 *   // No devolver nada
 * }
 * ```
 */
export function ApiRemoveNoContent(options?: {
  summary?: string
  description?: string
  conflictMessage?: string
}) {
  const summary = options?.summary || 'Eliminar recurso'
  const description =
    options?.description || 'Elimina el recurso sin devolver contenido.'

  const decorators = [
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary, description }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Recurso eliminado exitosamente (sin contenido)',
    }),
    ApiNotFoundResponse('Recurso no encontrado'),
    ApiStandardResponses({ exclude: [400] }),
  ]

  if (options?.conflictMessage) {
    decorators.splice(3, 0, ApiConflictResponse(options.conflictMessage))
  }

  return applyDecorators(...decorators)
}

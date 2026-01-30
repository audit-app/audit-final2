import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Request, Response } from 'express'
import { RESPONSE_MESSAGE_KEY } from '../http/decorators/response-message.decorator'
import {
  SuccessResponseDto,
  PaginatedResponseDto,
  PaginationMeta,
} from '@core/dtos'

/**
 * Transform Interceptor
 *
 * Transforma todas las respuestas exitosas al formato estándar definido en SuccessResponseDto.
 * Este interceptor usa los DTOs unificados como ÚNICO punto de verdad.
 *
 * Funcionalidades:
 * - Envuelve respuestas en SuccessResponseDto
 * - Detecta respuestas paginadas y usa PaginatedResponseDto
 * - Aplica mensajes personalizados del decorador @ResponseMessage
 * - Genera mensajes automáticos según el método HTTP
 *
 * IMPORTANTE: NO duplicar las estructuras de respuesta.
 * Los DTOs están en @core/dtos/responses/ y son usados por:
 * - Este interceptor (implementación)
 * - Swagger (documentación)
 * - Filters (errores)
 */

// Interfaz interna para detectar si viene paginado
interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponseDto<T> | PaginatedResponseDto<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponseDto<T> | PaginatedResponseDto<T>> {
    return next.handle().pipe(
      map((data: unknown) => {
        const ctx = context.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()

        const statusCode = response.statusCode
        const method = request.method

        // 1. Obtener mensaje personalizado o default
        const customMessage = this.reflector.get<string>(
          RESPONSE_MESSAGE_KEY,
          context.getHandler(),
        )

        const message = customMessage || this.getDefaultMessage(method)

        // 2. Detectar si es una respuesta paginada
        if (this.isPaginatedResponse(data)) {
          // Crear respuesta paginada usando el DTO
          const paginatedResponse = new PaginatedResponseDto<T>()
          paginatedResponse.success = true
          paginatedResponse.statusCode = statusCode
          paginatedResponse.message = message
          paginatedResponse.data = data.data
          paginatedResponse.meta = data.meta
          paginatedResponse.timestamp = new Date().toISOString()

          return paginatedResponse
        } else {
          // Crear respuesta normal usando el DTO
          const successResponse = new SuccessResponseDto<T>()
          successResponse.success = true
          successResponse.statusCode = statusCode
          successResponse.message = message
          successResponse.data = (data as T) ?? null
          successResponse.timestamp = new Date().toISOString()

          return successResponse
        }
      }),
    )
  }

  /**
   * Type Guard: Verifica si el objeto es una respuesta paginada.
   * Esto permite a TypeScript acceder a .data y .meta sin errores.
   */
  private isPaginatedResponse(data: unknown): data is PaginatedResult<T> {
    if (typeof data !== 'object' || data === null) {
      return false
    }

    const record = data as Record<string, unknown>

    const hasData = 'data' in record && Array.isArray(record.data)
    const hasMeta =
      'meta' in record &&
      typeof record.meta === 'object' &&
      record.meta !== null

    return hasData && hasMeta
  }

  /**
   * Genera mensaje automático según el método HTTP
   */
  private getDefaultMessage(method: string): string {
    switch (method.toUpperCase()) {
      case 'POST':
        return 'Registro creado correctamente'
      case 'PATCH':
      case 'PUT':
        return 'Actualización exitosa'
      case 'DELETE':
        return 'Eliminación exitosa'
      case 'GET':
      default:
        return 'Operación exitosa'
    }
  }
}

// Re-export para compatibilidad backwards
export type StandardResponse<T> = SuccessResponseDto<T>

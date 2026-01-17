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
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator'
import { PaginationMeta } from '@core/dtos'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface StandardResponse<T> {
  success: boolean
  statusCode: number
  message: string
  data: T | null
  meta?: PaginationMeta
  timestamp: string
}

// Interfaz interna para detectar si viene paginado
interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

// ---------------------------------------------------------------------------
// Interceptor
// ---------------------------------------------------------------------------

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T | T[]>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T | T[]>> {
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

        // 2. Definir la estructura base
        const result: StandardResponse<T | T[]> = {
          success: true,
          statusCode,
          message,
          data: null,
          timestamp: new Date().toISOString(),
        }

        // 3. Lógica de Aplanamiento (Unwrapping)
        if (this.isPaginatedResponse(data)) {
          // Si entra aquí, TypeScript YA SABE que data tiene .data y .meta
          result.data = data.data
          result.meta = data.meta
        } else {
          // Si no, es data normal (o null)
          // Hacemos un cast seguro porque si no es paginado, es T
          result.data = (data as T) ?? null
        }

        return result
      }),
    )
  }

  /**
   * Type Guard: Verifica si el objeto es una respuesta paginada.
   * Esto permite a TypeScript acceder a .data y .meta sin errores.
   */
  private isPaginatedResponse(data: unknown): data is PaginatedResult<T> {
    // 1. Verificar si es un objeto válido y no es null
    if (typeof data !== 'object' || data === null) {
      return false
    }

    // 2. Casteo seguro: "Si es objeto, tiene claves string y valores desconocidos"
    const record = data as Record<string, unknown>

    // 3. Validar propiedades sin usar 'any'
    const hasData = 'data' in record && Array.isArray(record.data)
    const hasMeta =
      'meta' in record &&
      typeof record.meta === 'object' &&
      record.meta !== null

    return hasData && hasMeta
  }

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

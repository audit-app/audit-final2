import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { LoggerService } from '../logger/logger.service'
import { envs } from '../config'
import { ErrorResponseDto } from '@core/dtos'

/**
 * HTTP Exception Filter
 *
 * Captura TODAS las excepciones de la aplicación y las formatea usando ErrorResponseDto.
 * Este filter usa el DTO unificado como ÚNICO punto de verdad para errores.
 *
 * Funcionalidades:
 * - Captura HttpException, Database Errors y errores genéricos
 * - Formatea respuestas usando ErrorResponseDto
 * - Loguea excepciones con contexto de usuario
 * - Oculta detalles en producción
 *
 * IMPORTANTE: NO duplicar la estructura de ErrorResponseDto.
 * El DTO está en @core/dtos/responses/ y es usado por:
 * - Este filter (implementación)
 * - Swagger (documentación)
 * - Interceptors (tipo de respuesta)
 */

// 1. Definimos una interfaz para el Error de DB (Postgres/TypeORM)
interface DatabaseError extends Error {
  code?: string
  detail?: string
  table?: string
  constraint?: string
}

// 3. Interfaz interna para el resultado del parsing
interface ParsedException {
  statusCode: number
  message: string | string[]
  error: string
  details?: unknown
  validationErrors?: Record<string, unknown>
  summary?: Record<string, unknown>
  errors?: unknown[] // Para errores de validación personalizados (template import, etc.)
  totalErrors?: number // Total de errores encontrados
}

// 4. Interfaz para el contexto de usuario en logs
interface UserContext {
  userId: string
  userEmail: string
  userName: string
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    // Determinar el status code y mensaje
    const parsed = this.parseException(exception)

    // AQUI ESTA LA MEJORA PRINCIPAL:
    // Ya no usamos 'as any'. TypeScript sabe que request.user es JwtPayload | undefined
    // gracias a tu archivo de declaración.
    const user = request.user

    const userContext: UserContext | undefined = user
      ? {
          userId: user.sub, // TypeScript ahora valida que 'sub' exista en JwtPayload
          userEmail: user.email, // TypeScript valida 'email'
          userName: user.username, // TypeScript valida 'username'
        }
      : undefined

    // Loguear la excepción
    this.logException(exception, parsed, request, userContext)

    // Construir respuesta de error usando el DTO unificado
    const errorResponse = new ErrorResponseDto()
    errorResponse.success = false
    errorResponse.statusCode = parsed.statusCode
    errorResponse.timestamp = new Date().toISOString()
    errorResponse.path = request.url
    errorResponse.method = request.method
    errorResponse.message = Array.isArray(parsed.message)
      ? 'Error de validación'
      : parsed.message
    errorResponse.error = parsed.error

    // Asignación condicional limpia
    if (parsed.validationErrors)
      errorResponse.validationErrors = parsed.validationErrors
    if (Array.isArray(parsed.message)) errorResponse.errors = parsed.message
    if (parsed.summary) errorResponse.summary = parsed.summary

    // Custom validation errors (template import, etc.)
    if (parsed.errors) errorResponse.errors = parsed.errors
    if (parsed.totalErrors !== undefined)
      errorResponse.totalErrors = parsed.totalErrors

    // Detalles solo en desarrollo
    if (parsed.details && !envs.app.isProduction) {
      errorResponse.details = parsed.details
    }

    response.status(parsed.statusCode).json(errorResponse)
  }

  /**
   * Lógica de Log separada para mantener el catch limpio
   */
  private logException(
    exception: unknown,
    parsed: ParsedException,
    request: Request,
    userContext: UserContext | undefined,
  ): void {
    const logData = {
      statusCode: parsed.statusCode,
      path: request.url,
      method: request.method,
      user: userContext,
    }

    if (exception instanceof Error) {
      this.logger.logException(exception, {
        req: request,
        user: userContext,
        additionalData: logData,
      })
    } else {
      this.logger.logUnhandledException(
        new Error(
          typeof exception === 'string' ? exception : 'Unknown exception',
        ),
        {
          originalException: exception,
          ...logData,
        },
      )
    }
  }

  private parseException(exception: unknown): ParsedException {
    // 1. HttpException de NestJS
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const response = exception.getResponse()

      if (typeof response === 'object' && response !== null) {
        const responseObj = response as Record<string, unknown>

        // Detección de errores complejos (Excel, imports masivos)
        const hasComplexValidation =
          responseObj.errors &&
          typeof responseObj.errors === 'object' &&
          !Array.isArray(responseObj.errors) &&
          responseObj.summary

        if (hasComplexValidation) {
          return {
            statusCode: status,
            message: (responseObj.message as string) || exception.message,
            error: (responseObj.error as string) || exception.name,
            validationErrors: responseObj.errors as Record<string, unknown>,
            summary: responseObj.summary as Record<string, unknown>,
          }
        }

        // Extracción segura de detalles

        const {
          message,
          error,
          statusCode,
          errors,
          totalErrors,
          ...additionalInfo
        } = responseObj

        return {
          statusCode: status,
          message: (message as string | string[]) || exception.message,
          error: (error as string) || exception.name,
          errors: errors
            ? Array.isArray(errors)
              ? errors
              : [errors]
            : undefined,
          totalErrors: totalErrors as number | undefined,
          details:
            Object.keys(additionalInfo).length > 0 ? additionalInfo : undefined,
        }
      }

      return {
        statusCode: status,
        message: typeof response === 'string' ? response : exception.message,
        error: exception.name,
      }
    }

    // 2. Error de Base de Datos
    if (this.isDatabaseError(exception)) {
      return this.parseDatabaseError(exception)
    }

    // 3. Error Genérico (Standard JS Error)
    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
        error: exception.name,
        details: !envs.app.isProduction
          ? { stack: exception.stack }
          : undefined,
      }
    }

    // 4. Fallback absoluto
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'UnknownError',
    }
  }

  /**
   * Type Guard: Le dice a TypeScript que si esto devuelve true,
   * la variable es de tipo DatabaseError
   */
  private isDatabaseError(exception: unknown): exception is DatabaseError {
    return (
      exception instanceof Error &&
      (exception.name === 'QueryFailedError' || 'code' in exception)
    )
  }

  private parseDatabaseError(exception: DatabaseError): ParsedException {
    const code = exception.code

    const baseError = {
      error: 'DatabaseError',
      details: !envs.app.isProduction
        ? { originalError: exception.message, code, table: exception.table }
        : undefined,
    }

    switch (code) {
      case '23505': // Unique constraint
        return {
          ...baseError,
          statusCode: HttpStatus.CONFLICT,
          message:
            'Ya existe un registro con los datos proporcionados (Duplicado).',
          error: 'Conflict',
        }
      case '23503': // Foreign key
        return {
          ...baseError,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'El registro referenciado no existe o no es válido.',
          error: 'ForeignKeyViolation',
        }
      case '23502': // Not null
        return {
          ...baseError,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Faltan datos obligatorios para completar la operación.',
          error: 'NotNullViolation',
        }
      default:
        return {
          ...baseError,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno de base de datos.',
        }
    }
  }
}

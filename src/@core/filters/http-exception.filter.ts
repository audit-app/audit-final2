import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { LoggerService } from '../logger/logger.service'

interface ErrorResponse {
  statusCode: number
  timestamp: string
  path: string
  method: string
  message: string
  error?: string
  errors?: string[] // Array de errores de validación simples
  validationErrors?: unknown // Errores de validación complejos (ej: import Excel)
  summary?: unknown // Resumen de validación (ej: import Excel)
  details?: unknown
}

/**
 * Filtro global de excepciones que captura todos los errores
 * de la aplicación, los loguea y formatea la respuesta al cliente
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    // Determinar el status code y mensaje
    const { statusCode, message, error, details, validationErrors, summary } =
      this.parseException(exception)

    // Construir contexto de usuario
    const user = request.user as any
    const userContext = user
      ? {
          userId: user.sub as string,
          userEmail: user.email as string,
          userName: user.username as string,
        }
      : undefined

    // Loguear la excepción
    if (exception instanceof Error) {
      this.logger.logException(exception, {
        req: request,
        user: userContext,
        additionalData: {
          statusCode,
          path: request.url,
          method: request.method,
        },
      })
    } else {
      // Si no es un Error, loguear como unhandled
      this.logger.logUnhandledException(
        new Error(
          typeof exception === 'string' ? exception : 'Unknown exception',
        ),
        {
          originalException: exception,
          statusCode,
          path: request.url,
          method: request.method,
          user: userContext,
        },
      )
    }

    // Construir respuesta de error
    const errorResponse: ErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      // Si message es un array (errores de validación), mover a campo 'errors'
      message: Array.isArray(message) ? 'Error de validación' : message,
      error,
    }

    // Si hay errores de validación complejos (ej: import Excel)
    if (validationErrors) {
      errorResponse.validationErrors = validationErrors
    }
    // Si message era un array simple, agregarlo en campo 'errors'
    else if (Array.isArray(message)) {
      errorResponse.errors = message
    }

    // Si hay summary de validación (ej: import Excel)
    if (summary) {
      errorResponse.summary = summary
    }

    // Agregar detalles solo en desarrollo
    if (details && process.env.NODE_ENV !== 'production') {
      errorResponse.details = details
    }

    // Enviar respuesta
    response.status(statusCode).json(errorResponse)
  }

  /**
   * Parsea la excepción y extrae información útil
   */
  private parseException(exception: unknown): {
    statusCode: number
    message: string | string[]
    error: string
    details?: unknown
    validationErrors?: unknown
    summary?: unknown
  } {
    // HttpException de NestJS
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const response = exception.getResponse()

      // Si la respuesta es un objeto con mensaje
      if (typeof response === 'object' && response !== null) {
        const responseObj = response as Record<string, unknown>

        // Detectar si es un error de validación complejo (import Excel)
        // Tiene 'errors' como objeto (no array) y 'summary'
        const hasComplexValidation =
          responseObj.errors &&
          typeof responseObj.errors === 'object' &&
          !Array.isArray(responseObj.errors) &&
          responseObj.summary

        if (hasComplexValidation) {
          // Caso especial: errores de importación de Excel
          return {
            statusCode: status,
            message: (responseObj.message as string) || exception.message,
            error: (responseObj.error as string) || exception.name,
            validationErrors: responseObj.errors,
            summary: responseObj.summary,
          }
        }

        // Caso normal: extraer información adicional para details (no duplicar)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { message, error, statusCode: _, ...additionalInfo } = responseObj
        const hasAdditionalInfo = Object.keys(additionalInfo).length > 0

        return {
          statusCode: status,
          message:
            (responseObj.message as string | string[]) || exception.message,
          error: (responseObj.error as string) || exception.name,
          details:
            process.env.NODE_ENV !== 'production' && hasAdditionalInfo
              ? additionalInfo
              : undefined,
        }
      }

      // Si la respuesta es un string
      return {
        statusCode: status,
        message: typeof response === 'string' ? response : exception.message,
        error: exception.name,
      }
    }

    // Error de base de datos (TypeORM QueryFailedError)
    if (this.isDatabaseError(exception)) {
      return this.parseDatabaseError(exception as Error & { code?: string })
    }

    // Error estándar de JavaScript
    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message || 'Internal server error',
        error: exception.name || 'Error',
        details:
          process.env.NODE_ENV !== 'production'
            ? {
                stack: exception.stack,
              }
            : undefined,
      }
    }

    // Excepción desconocida
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'UnknownError',
      details: process.env.NODE_ENV !== 'production' ? exception : undefined,
    }
  }

  /**
   * Verifica si el error es un QueryFailedError de TypeORM
   */
  private isDatabaseError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      exception.name === 'QueryFailedError' &&
      'code' in exception
    )
  }

  /**
   * Parsea errores de base de datos y los convierte en respuestas HTTP apropiadas
   */
  private parseDatabaseError(exception: Error & { code?: string }): {
    statusCode: number
    message: string
    error: string
    details?: unknown
  } {
    const code = exception.code

    // Error de constraint única (duplicate key)
    // PostgreSQL code: 23505
    if (code === '23505') {
      return {
        statusCode: HttpStatus.CONFLICT,
        message:
          'Ya existe un registro con los datos proporcionados. Por favor, verifica email, username o CI.',
        error: 'Conflict',
        details:
          process.env.NODE_ENV !== 'production'
            ? {
                originalError: exception.message,
                code,
              }
            : undefined,
      }
    }

    // Error de foreign key constraint
    // PostgreSQL code: 23503
    if (code === '23503') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'El recurso referenciado no existe',
        error: 'ForeignKeyViolation',
        details:
          process.env.NODE_ENV !== 'production'
            ? {
                originalError: exception.message,
                code,
              }
            : undefined,
      }
    }

    // Error de violación de constraint NOT NULL
    // PostgreSQL code: 23502
    if (code === '23502') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Faltan datos requeridos',
        error: 'NotNullViolation',
        details:
          process.env.NODE_ENV !== 'production'
            ? {
                originalError: exception.message,
                code,
              }
            : undefined,
      }
    }

    // Otros errores de base de datos
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error de base de datos',
      error: 'DatabaseError',
      details:
        process.env.NODE_ENV !== 'production'
          ? {
              originalError: exception.message,
              code,
              stack: exception.stack,
            }
          : undefined,
    }
  }
}

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ThrottlerException } from '@nestjs/throttler'
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
  column?: string
  driverError?: {
    code?: string
    detail?: string
  }
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

    const parsed = this.parseException(exception)
    const user = request.user

    const userContext: UserContext | undefined = user
      ? {
          userId: user.sub,
          userEmail: user.email,
          userName: user.username,
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
    // 1. ThrottlerException (Rate Limiting Global)
    if (exception instanceof ThrottlerException) {
      return {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message:
          'Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde.',
        error: 'Too Many Requests',
      }
    }

    // 2. HttpException de NestJS (incluye TooManyAttemptsException)
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

    // 3. Error de Base de Datos (TypeORM/PostgreSQL)
    if (this.isDatabaseError(exception)) {
      return this.parseDatabaseError(exception)
    }

    // 4. Error Genérico (Standard JS Error)
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

    // 5. Fallback absoluto
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'UnknownError',
    }
  }

  /**
   * Type Guard: Le dice a TypeScript que si esto devuelve true,
   * la variable es de tipo DatabaseError
   *
   * Detecta errores de TypeORM (QueryFailedError, EntityNotFoundError)
   * y errores de base de datos que tienen código de error
   */
  private isDatabaseError(exception: unknown): exception is DatabaseError {
    if (!(exception instanceof Error)) {
      return false
    }

    // Errores específicos de TypeORM
    if (
      exception.name === 'QueryFailedError' ||
      exception.name === 'EntityNotFoundError' ||
      exception.name === 'EntityPropertyNotFoundError'
    ) {
      return true
    }

    // Errores con código de PostgreSQL
    return 'code' in exception && typeof (exception as any).code === 'string'
  }

  private parseDatabaseError(exception: DatabaseError): ParsedException {
    // Caso especial: EntityNotFoundError de TypeORM
    if (exception.name === 'EntityNotFoundError') {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'El registro solicitado no fue encontrado.',
        error: 'Not Found',
        details: !envs.app.isProduction
          ? { originalError: exception.message }
          : undefined,
      }
    }

    // Extraer código de error (puede estar en exception.code o exception.driverError.code)
    const code = exception.code || exception.driverError?.code

    const baseError = {
      error: 'DatabaseError',
      details: !envs.app.isProduction
        ? {
            originalError: exception.message,
            code,
            table: exception.table,
            column: exception.column,
            constraint: exception.constraint,
          }
        : undefined,
    }

    // Códigos de error de PostgreSQL
    // Referencia: https://www.postgresql.org/docs/current/errcodes-appendix.html
    switch (code) {
      // ============ INTEGRITY CONSTRAINT VIOLATIONS (23xxx) ============
      case '23000': // integrity_constraint_violation
        return {
          ...baseError,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Violación de restricción de integridad.',
          error: 'IntegrityConstraintViolation',
        }

      case '23505': // unique_violation
        return {
          ...baseError,
          statusCode: HttpStatus.CONFLICT,
          message:
            'Ya existe un registro con los datos proporcionados (Duplicado).',
          error: 'UniqueViolation',
        }

      case '23503': // foreign_key_violation
        return {
          ...baseError,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'El registro referenciado no existe o no es válido.',
          error: 'ForeignKeyViolation',
        }

      case '23502': // not_null_violation
        return {
          ...baseError,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Faltan datos obligatorios para completar la operación.',
          error: 'NotNullViolation',
        }

      case '23514': // check_violation
        return {
          ...baseError,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Los datos no cumplen con las reglas de validación.',
          error: 'CheckViolation',
        }

      // ============ DATA EXCEPTIONS (22xxx) ============
      case '22001': // string_data_right_truncation
        return {
          ...baseError,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'El texto proporcionado es demasiado largo.',
          error: 'StringTooLong',
        }

      case '22P02': // invalid_text_representation
        return {
          ...baseError,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Formato de datos inválido.',
          error: 'InvalidTextRepresentation',
        }

      case '22003': // numeric_value_out_of_range
        return {
          ...baseError,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'El valor numérico está fuera de rango.',
          error: 'NumericOutOfRange',
        }

      // ============ QUERY ERRORS (42xxx) ============
      case '42P01': // undefined_table
        return {
          ...baseError,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error de configuración de base de datos.',
          error: 'UndefinedTable',
        }

      case '42703': // undefined_column
        return {
          ...baseError,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error de configuración de base de datos.',
          error: 'UndefinedColumn',
        }

      // ============ CONNECTION EXCEPTIONS (08xxx) ============
      case '08000': // connection_exception
      case '08003': // connection_does_not_exist
      case '08006': // connection_failure
        return {
          ...baseError,
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Error de conexión a la base de datos. Intenta nuevamente.',
          error: 'DatabaseConnectionError',
        }

      // ============ TIMEOUT (57xxx) ============
      case '57014': // query_canceled
        return {
          ...baseError,
          statusCode: HttpStatus.REQUEST_TIMEOUT,
          message: 'La operación tardó demasiado tiempo y fue cancelada.',
          error: 'QueryTimeout',
        }

      // ============ FALLBACK ============
      default:
        return {
          ...baseError,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: envs.app.isProduction
            ? 'Error interno de base de datos.'
            : `Error de base de datos: ${exception.message}`,
        }
    }
  }
}

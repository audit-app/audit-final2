/**
 * Standard API Response Definitions
 *
 * Definiciones reutilizables de respuestas HTTP estándar para Swagger.
 * Estos objetos se usan en los decoradores personalizados.
 *
 * IMPORTANTE: Este archivo usa ErrorResponseDto como single source of truth.
 * Los schemas inline están deprecados - usar getSchemaPath(ErrorResponseDto) en su lugar.
 */

import { HttpStatus } from '@nestjs/common'
import { getSchemaPath } from '@nestjs/swagger'
import { ErrorResponseDto } from '@core/dtos'

/**
 * Respuestas de validación (400)
 */
export const VALIDATION_ERROR_RESPONSE = {
  status: HttpStatus.BAD_REQUEST,
  description: 'Datos de entrada inválidos',
  schema: {
    $ref: getSchemaPath(ErrorResponseDto),
  },
}

/**
 * Respuestas de autenticación (401)
 */
export const UNAUTHORIZED_RESPONSE = {
  status: HttpStatus.UNAUTHORIZED,
  description: 'No autenticado - Token inválido o no proporcionado',
  schema: {
    $ref: getSchemaPath(ErrorResponseDto),
  },
}

/**
 * Respuestas de autorización (403)
 */
export const FORBIDDEN_RESPONSE = {
  status: HttpStatus.FORBIDDEN,
  description: 'Sin permisos - No tiene acceso a este recurso',
  schema: {
    $ref: getSchemaPath(ErrorResponseDto),
  },
}

/**
 * Respuestas de recurso no encontrado (404)
 */
export const NOT_FOUND_RESPONSE = {
  status: HttpStatus.NOT_FOUND,
  description: 'Recurso no encontrado',
  schema: {
    $ref: getSchemaPath(ErrorResponseDto),
  },
}

/**
 * Respuestas de conflicto (409)
 */
export const CONFLICT_RESPONSE = {
  status: HttpStatus.CONFLICT,
  description: 'Conflicto - El recurso ya existe',
  schema: {
    $ref: getSchemaPath(ErrorResponseDto),
  },
}

/**
 * Respuestas de error interno (500)
 */
export const INTERNAL_SERVER_ERROR_RESPONSE = {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  description: 'Error interno del servidor',
  schema: {
    $ref: getSchemaPath(ErrorResponseDto),
  },
}

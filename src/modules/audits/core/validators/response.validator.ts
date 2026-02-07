import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import { AuditResponseEntity } from '../../entities/audit-response.entity'
import { ResponseStatus } from '../../enums/response-status.enum'
import { AUDIT_RESPONSES_REPOSITORY } from '../../tokens'
import type { IAuditResponsesRepository } from '../../repositories'

/**
 * Servicio de validación de reglas de negocio para respuestas de auditoría
 *
 * Responsabilidades:
 * - Validar existencia de respuestas
 * - Validar pertenencia a auditoría
 * - Validar transiciones de estado
 * - Validar datos de evaluación (score, maturity level, etc.)
 */
@Injectable()
export class ResponseValidator {
  constructor(
    @Inject(AUDIT_RESPONSES_REPOSITORY)
    private readonly responsesRepository: IAuditResponsesRepository,
  ) {}

  /**
   * Verifica que una respuesta existe y LA DEVUELVE
   * Evita tener que volver a consultarla en el caso de uso
   *
   * @param responseId - ID de la respuesta a verificar
   * @returns La entidad de respuesta encontrada
   * @throws BadRequestException si la respuesta no existe
   */
  async validateAndGetResponse(
    responseId: string,
  ): Promise<AuditResponseEntity> {
    const response = await this.responsesRepository.findById(responseId)

    if (!response) {
      throw new BadRequestException(
        `Respuesta con ID ${responseId} no encontrada`,
      )
    }

    return response
  }

  /**
   * Valida que una respuesta pertenece a una auditoría específica
   *
   * @param response - Respuesta a validar
   * @param auditId - ID de la auditoría esperada
   * @throws BadRequestException si no pertenece
   */
  validateBelongsToAudit(
    response: AuditResponseEntity,
    auditId: string,
  ): void {
    if (response.auditId !== auditId) {
      throw new BadRequestException(
        'La respuesta no pertenece a esta auditoría',
      )
    }
  }

  /**
   * Valida que el score esté en el rango válido (0-100)
   * Nota: El DTO ya valida esto, pero es útil tenerlo aquí también
   *
   * @param score - Score a validar
   * @throws BadRequestException si está fuera de rango
   */
  validateScore(score: number): void {
    if (score < 0 || score > 100) {
      throw new BadRequestException(
        'El score debe estar entre 0 y 100',
      )
    }
  }

  /**
   * Valida que el nivel de madurez esté en el rango válido
   * Para la mayoría de frameworks: 0-5
   *
   * @param level - Nivel de madurez a validar
   * @param minLevel - Nivel mínimo del framework (default: 0)
   * @param maxLevel - Nivel máximo del framework (default: 5)
   * @throws BadRequestException si está fuera de rango
   */
  validateMaturityLevel(
    level: number,
    minLevel: number = 0,
    maxLevel: number = 5,
  ): void {
    if (level < minLevel || level > maxLevel) {
      throw new BadRequestException(
        `El nivel de madurez debe estar entre ${minLevel} y ${maxLevel}`,
      )
    }
  }

  /**
   * Valida que una respuesta se puede marcar como revisada
   * Requisitos:
   * - Debe estar en estado COMPLETED
   *
   * @param response - Respuesta a validar
   * @throws BadRequestException si no está COMPLETED
   */
  validateCanBeReviewed(response: AuditResponseEntity): void {
    if (response.status !== ResponseStatus.COMPLETED) {
      throw new BadRequestException(
        'Solo se pueden revisar respuestas que estén en estado COMPLETED',
      )
    }
  }

  /**
   * Valida que una respuesta se puede marcar como completada
   * Requisitos:
   * - Debe tener score asignado
   * - Debe tener complianceLevel asignado
   *
   * @param response - Respuesta a validar
   * @throws BadRequestException si falta información
   */
  validateCanBeCompleted(response: AuditResponseEntity): void {
    const errors: string[] = []

    if (response.score === null) {
      errors.push('score')
    }

    if (response.complianceLevel === null) {
      errors.push('complianceLevel')
    }

    if (errors.length > 0) {
      throw new BadRequestException(
        `Para marcar como completada, la respuesta debe tener: ${errors.join(', ')}`,
      )
    }
  }

  /**
   * Valida que todas las respuestas requeridas estén completadas
   * Útil antes de cerrar una auditoría
   *
   * @param responses - Respuestas de la auditoría
   * @throws BadRequestException si hay respuestas sin completar
   */
  validateAllResponsesComplete(responses: AuditResponseEntity[]): void {
    const incomplete = responses.filter(
      (r) =>
        r.status !== ResponseStatus.COMPLETED &&
        r.status !== ResponseStatus.REVIEWED,
    )

    if (incomplete.length > 0) {
      throw new BadRequestException(
        `Hay ${incomplete.length} respuesta(s) sin completar. Todas las respuestas deben estar COMPLETED o REVIEWED antes de cerrar la auditoría.`,
      )
    }
  }

  /**
   * Valida que el peso (weight) esté en el rango válido (0-100)
   *
   * @param weight - Peso a validar
   * @throws BadRequestException si está fuera de rango
   */
  validateWeight(weight: number): void {
    if (weight < 0 || weight > 100) {
      throw new BadRequestException(
        'El peso (weight) debe estar entre 0 y 100',
      )
    }
  }

  /**
   * Valida que la suma de pesos sea aproximadamente 100
   * Permite pequeña tolerancia por decimales (±0.01)
   *
   * @param responses - Respuestas con pesos
   * @throws BadRequestException si la suma no es 100
   */
  validateWeightsSum(responses: AuditResponseEntity[]): void {
    const totalWeight = responses.reduce((sum, r) => sum + r.weight, 0)
    const tolerance = 0.01

    if (Math.abs(totalWeight - 100) > tolerance) {
      throw new BadRequestException(
        `La suma de los pesos debe ser 100 (actual: ${totalWeight.toFixed(2)})`,
      )
    }
  }
}

import { Injectable } from '@nestjs/common'
import { AuditResponseEntity } from '../../entities/audit-response.entity'
import { StandardEntity } from '../../../audit-library/standards/entities/standard.entity'
import { UpdateResponseDto } from '../../responses/dtos/update-response.dto'
import { ResponseStatus } from '../../enums/response-status.enum'

/**
 * Factory para crear y actualizar respuestas de auditoría
 *
 * Responsabilidades:
 * - Crear AuditResponseEntity desde Standard (al inicializar)
 * - Actualizar AuditResponseEntity desde UpdateResponseDto
 * - Copiar weight del standard (inmutabilidad)
 * - Normalizar datos de evaluación
 *
 * Beneficios:
 * - Centraliza lógica de creación/actualización de respuestas
 * - Mantiene consistencia en ponderaciones
 * - Facilita testing
 * - Separa transformación de lógica de negocio
 */
@Injectable()
export class AuditResponseFactory {
  /**
   * Crea una nueva AuditResponseEntity desde un Standard auditable
   * Se usa al inicializar respuestas de una auditoría
   *
   * @param auditId - ID de la auditoría
   * @param standard - Standard auditable del template
   * @returns Nueva instancia de AuditResponseEntity (sin persistir)
   */
  createFromStandard(
    auditId: string,
    standard: StandardEntity,
  ): AuditResponseEntity {
    const response = new AuditResponseEntity()

    // IDs de relación
    response.auditId = auditId
    response.standardId = standard.id

    // Copiar ponderación del standard (inmutabilidad de auditoría)
    response.weight = standard.weight

    // Inicializar en NOT_STARTED
    response.status = ResponseStatus.NOT_STARTED

    // Todos los campos de evaluación en null (sin evaluar)
    response.score = null
    response.complianceLevel = null
    response.achievedMaturityLevel = null
    response.findings = null
    response.recommendations = null
    response.notes = null
    response.assignedUserId = null
    response.reviewedBy = null
    response.reviewedAt = null

    return response
  }

  /**
   * Crea múltiples AuditResponseEntity desde un array de Standards
   * Útil para inicialización en batch
   *
   * @param auditId - ID de la auditoría
   * @param standards - Array de standards auditables
   * @returns Array de nuevas instancias de AuditResponseEntity (sin persistir)
   */
  createManyFromStandards(
    auditId: string,
    standards: StandardEntity[],
  ): AuditResponseEntity[] {
    return standards.map((standard) =>
      this.createFromStandard(auditId, standard),
    )
  }

  /**
   * Actualiza una AuditResponseEntity existente desde UpdateResponseDto
   *
   * @param response - Respuesta existente
   * @param dto - Datos a actualizar
   * @returns La entidad actualizada (misma referencia)
   */
  updateFromDto(
    response: AuditResponseEntity,
    dto: UpdateResponseDto,
  ): AuditResponseEntity {
    // Actualizar status
    if (dto.status !== undefined) {
      response.status = dto.status
    }

    // Actualizar nivel de madurez alcanzado
    if (dto.achievedMaturityLevel !== undefined) {
      response.achievedMaturityLevel = dto.achievedMaturityLevel
    }

    // Actualizar score (0-100)
    if (dto.score !== undefined) {
      response.score = dto.score
    }

    // Actualizar nivel de cumplimiento
    if (dto.complianceLevel !== undefined) {
      response.complianceLevel = dto.complianceLevel
    }

    // Actualizar hallazgos
    if (dto.findings !== undefined) {
      response.findings = dto.findings || null
    }

    // Actualizar recomendaciones
    if (dto.recommendations !== undefined) {
      response.recommendations = dto.recommendations || null
    }

    // Actualizar notas internas
    if (dto.notes !== undefined) {
      response.notes = dto.notes || null
    }

    // Actualizar asignación
    if (dto.assignedUserId !== undefined) {
      response.assignedUserId = dto.assignedUserId || null
    }

    return response
  }

  /**
   * Marca una respuesta como revisada por el lead auditor
   *
   * @param response - Respuesta a marcar como revisada
   * @param reviewerId - ID del usuario que revisa (lead auditor)
   * @returns La entidad actualizada (misma referencia)
   */
  markAsReviewed(
    response: AuditResponseEntity,
    reviewerId: string,
  ): AuditResponseEntity {
    response.status = ResponseStatus.REVIEWED
    response.reviewedBy = reviewerId
    response.reviewedAt = new Date()
    return response
  }

  /**
   * Marca una respuesta como completada (lista para revisión)
   *
   * @param response - Respuesta a marcar como completada
   * @returns La entidad actualizada (misma referencia)
   */
  markAsCompleted(response: AuditResponseEntity): AuditResponseEntity {
    response.status = ResponseStatus.COMPLETED
    return response
  }

  /**
   * Marca una respuesta como en progreso
   *
   * @param response - Respuesta a marcar como en progreso
   * @param assignedUserId - ID del usuario asignado (opcional)
   * @returns La entidad actualizada (misma referencia)
   */
  markAsInProgress(
    response: AuditResponseEntity,
    assignedUserId?: string,
  ): AuditResponseEntity {
    response.status = ResponseStatus.IN_PROGRESS
    if (assignedUserId) {
      response.assignedUserId = assignedUserId
    }
    return response
  }

  /**
   * Reinicia una respuesta a NOT_STARTED
   * Útil para reabrir evaluaciones o corregir errores
   *
   * @param response - Respuesta a reiniciar
   * @returns La entidad actualizada (misma referencia)
   */
  reset(response: AuditResponseEntity): AuditResponseEntity {
    response.status = ResponseStatus.NOT_STARTED
    response.score = null
    response.complianceLevel = null
    response.achievedMaturityLevel = null
    response.findings = null
    response.recommendations = null
    response.notes = null
    response.assignedUserId = null
    response.reviewedBy = null
    response.reviewedAt = null
    return response
  }
}

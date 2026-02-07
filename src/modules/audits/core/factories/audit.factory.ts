import { Injectable } from '@nestjs/common'
import { AuditEntity } from '../../entities/audit.entity'
import { CreateAuditDto } from '../../audit-management/dtos/create-audit.dto'
import { UpdateAuditDto } from '../../audit-management/dtos/update-audit.dto'
import { AuditStatus } from '../../enums/audit-status.enum'

/**
 * Factory para crear y actualizar entidades de Auditoría
 *
 * Responsabilidades:
 * - Crear AuditEntity desde CreateAuditDto
 * - Actualizar AuditEntity desde UpdateAuditDto
 * - Crear auditorías de revisión desde auditoría padre
 * - Normalizar datos (fechas, valores null, etc.)
 *
 * Beneficios:
 * - Centraliza lógica de creación/actualización
 * - Mantiene consistencia en la creación de entidades
 * - Facilita testing (mock del factory)
 * - Separa lógica de transformación de lógica de negocio
 */
@Injectable()
export class AuditFactory {
  /**
   * Crea una nueva entidad AuditEntity desde CreateAuditDto
   *
   * @param dto - Datos de la auditoría a crear
   * @param code - Código único generado (AUD-YYYY-NNN)
   * @returns Nueva instancia de AuditEntity (sin persistir)
   */
  createFromDto(dto: CreateAuditDto, code: string): AuditEntity {
    const audit = new AuditEntity()

    // Identificación
    audit.code = code
    audit.name = dto.name
    audit.description = dto.description || null

    // Relaciones principales
    audit.templateId = dto.templateId
    audit.organizationId = dto.organizationId
    audit.frameworkId = dto.frameworkId || null

    // Fechas planificadas
    audit.startDate = dto.startDate ? new Date(dto.startDate) : null
    audit.endDate = dto.endDate ? new Date(dto.endDate) : null

    // Estado inicial y revisión
    audit.status = AuditStatus.DRAFT
    audit.revisionNumber = 0
    audit.parentAuditId = null

    // Resultados (se calculan después)
    audit.overallScore = null
    audit.maturityLevel = null

    // Fechas reales (se llenan al iniciar/cerrar)
    audit.actualStartDate = null
    audit.closedAt = null

    return audit
  }

  /**
   * Actualiza una entidad AuditEntity existente desde UpdateAuditDto
   * Solo actualiza campos permitidos en estado DRAFT
   *
   * @param audit - Entidad de auditoría existente
   * @param dto - Datos a actualizar
   * @returns La entidad actualizada (misma referencia)
   */
  updateFromDto(audit: AuditEntity, dto: UpdateAuditDto): AuditEntity {
    // Solo actualizar campos opcionales que vengan en el DTO
    if (dto.name !== undefined) {
      audit.name = dto.name
    }

    if (dto.description !== undefined) {
      audit.description = dto.description || null
    }

    if (dto.startDate !== undefined) {
      audit.startDate = dto.startDate ? new Date(dto.startDate) : null
    }

    if (dto.endDate !== undefined) {
      audit.endDate = dto.endDate ? new Date(dto.endDate) : null
    }

    // Nota: templateId, organizationId, frameworkId NO se actualizan
    // porque cambiarían la naturaleza de la auditoría

    return audit
  }

  /**
   * Crea una auditoría de revisión (follow-up) basada en una auditoría cerrada
   *
   * @param parentAudit - Auditoría padre (debe estar CLOSED)
   * @param code - Código único para la nueva auditoría
   * @param name - Nombre opcional (si no se provee, usa el del padre con sufijo)
   * @returns Nueva instancia de AuditEntity para revisión (sin persistir)
   */
  createRevisionFromParent(
    parentAudit: AuditEntity,
    code: string,
    name?: string,
  ): AuditEntity {
    const revision = new AuditEntity()

    // Identificación
    revision.code = code
    revision.name = name || `${parentAudit.name} (Revisión ${parentAudit.revisionNumber + 1})`
    revision.description = parentAudit.description

    // Copiar relaciones principales
    revision.templateId = parentAudit.templateId
    revision.organizationId = parentAudit.organizationId
    revision.frameworkId = parentAudit.frameworkId

    // Relación con auditoría padre
    revision.parentAuditId = parentAudit.id
    revision.revisionNumber = parentAudit.revisionNumber + 1

    // Estado inicial
    revision.status = AuditStatus.DRAFT

    // Fechas (sin copiar, se definen al crear revisión)
    revision.startDate = null
    revision.endDate = null
    revision.actualStartDate = null
    revision.closedAt = null

    // Resultados (se calculan después)
    revision.overallScore = null
    revision.maturityLevel = null

    return revision
  }

  /**
   * Marca una auditoría como iniciada (DRAFT → IN_PROGRESS)
   *
   * @param audit - Auditoría a iniciar
   * @returns La entidad actualizada (misma referencia)
   */
  markAsStarted(audit: AuditEntity): AuditEntity {
    audit.status = AuditStatus.IN_PROGRESS
    audit.actualStartDate = new Date()
    return audit
  }

  /**
   * Marca una auditoría como cerrada (IN_PROGRESS → CLOSED)
   *
   * @param audit - Auditoría a cerrar
   * @param overallScore - Score final calculado (0-100)
   * @param maturityLevel - Nivel de madurez alcanzado (0-5, opcional)
   * @returns La entidad actualizada (misma referencia)
   */
  markAsClosed(
    audit: AuditEntity,
    overallScore: number,
    maturityLevel?: number | null,
  ): AuditEntity {
    audit.status = AuditStatus.CLOSED
    audit.closedAt = new Date()
    audit.overallScore = overallScore
    audit.maturityLevel = maturityLevel || null
    return audit
  }

  /**
   * Marca una auditoría como archivada (CLOSED → ARCHIVED)
   *
   * @param audit - Auditoría a archivar
   * @returns La entidad actualizada (misma referencia)
   */
  markAsArchived(audit: AuditEntity): AuditEntity {
    audit.status = AuditStatus.ARCHIVED
    return audit
  }
}

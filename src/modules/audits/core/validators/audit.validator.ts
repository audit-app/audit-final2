import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import { AuditEntity } from '../../entities/audit.entity'
import { AuditStatus } from '../../enums/audit-status.enum'
import {
  AuditNotFoundException,
  InvalidAuditStateException,
  AuditCannotBeRevisedException,
} from '../../exceptions'
import { AUDITS_REPOSITORY } from '../../tokens'
import { TEMPLATES_REPOSITORY } from '../../../audit-library/templates/tokens'
import { TemplateStatus } from '../../../audit-library/templates/constants/template-status.enum'
import { TemplateNotFoundException } from '../../../audit-library/templates/exceptions'
import type { IAuditsRepository } from '../../repositories'
import type { ITemplatesRepository } from '../../../audit-library/templates/repositories'

/**
 * Servicio de validación de reglas de negocio para auditorías
 * Siguiendo el patrón de UserValidator
 *
 * Responsabilidades:
 * - Validar existencia de auditorías
 * - Validar transiciones de estado
 * - Validar reglas de negocio (revisiones, templates, etc.)
 * - Validar permisos de operaciones
 */
@Injectable()
export class AuditValidator {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templatesRepository: ITemplatesRepository,
  ) {}

  /**
   * Verifica que una auditoría existe y LA DEVUELVE
   * Evita tener que volver a consultarla en el caso de uso
   *
   * @param auditId - ID de la auditoría a verificar
   * @returns La entidad de auditoría encontrada
   * @throws AuditNotFoundException si la auditoría no existe
   */
  async validateAndGetAudit(auditId: string): Promise<AuditEntity> {
    const audit = await this.auditsRepository.findById(auditId)

    if (!audit) {
      throw new AuditNotFoundException(auditId)
    }

    return audit
  }

  /**
   * Valida que el código de auditoría sea único
   *
   * @param code - Código a validar
   * @throws BadRequestException si el código ya existe
   */
  async validateUniqueCode(code: string): Promise<void> {
    const existing = await this.auditsRepository.findByCode(code)

    if (existing) {
      throw new BadRequestException(
        `Ya existe una auditoría con el código "${code}"`,
      )
    }
  }

  /**
   * Valida que una auditoría esté en un estado específico
   *
   * @param audit - Auditoría a validar
   * @param expectedStatus - Estado esperado
   * @param operation - Nombre de la operación que requiere el estado
   * @throws InvalidAuditStateException si el estado no coincide
   */
  validateAuditStatus(
    audit: AuditEntity,
    expectedStatus: AuditStatus,
    operation: string,
  ): void {
    if (audit.status !== expectedStatus) {
      throw new InvalidAuditStateException(audit.status, operation)
    }
  }

  /**
   * Valida que una auditoría esté en uno de los estados permitidos
   *
   * @param audit - Auditoría a validar
   * @param allowedStatuses - Estados permitidos
   * @param operation - Nombre de la operación
   * @throws InvalidAuditStateException si el estado no es válido
   */
  validateAuditStatusIn(
    audit: AuditEntity,
    allowedStatuses: AuditStatus[],
    operation: string,
  ): void {
    if (!allowedStatuses.includes(audit.status)) {
      throw new InvalidAuditStateException(audit.status, operation)
    }
  }

  /**
   * Valida que una auditoría se puede editar (debe estar en DRAFT)
   *
   * @param audit - Auditoría a validar
   * @throws InvalidAuditStateException si no está en DRAFT
   */
  validateIsEditable(audit: AuditEntity): void {
    this.validateAuditStatus(audit, AuditStatus.DRAFT, 'editar')
  }

  /**
   * Valida que una auditoría se puede iniciar
   * Requisitos:
   * - Debe estar en estado DRAFT
   * - Debe tener al menos un miembro asignado
   *
   * @param audit - Auditoría a validar (debe incluir assignments)
   * @throws InvalidAuditStateException si no está en DRAFT
   * @throws BadRequestException si no tiene miembros
   */
  validateCanStart(audit: AuditEntity): void {
    // 1. Validar estado
    this.validateAuditStatus(audit, AuditStatus.DRAFT, 'iniciar')

    // 2. Validar que tenga miembros asignados
    if (!audit.assignments || audit.assignments.length === 0) {
      throw new BadRequestException(
        'La auditoría debe tener al menos un miembro asignado para iniciarla',
      )
    }
  }

  /**
   * Valida que una auditoría se puede cerrar
   * Requisitos:
   * - Debe estar en estado IN_PROGRESS
   *
   * @param audit - Auditoría a validar
   * @throws InvalidAuditStateException si no está IN_PROGRESS
   */
  validateCanClose(audit: AuditEntity): void {
    this.validateAuditStatus(audit, AuditStatus.IN_PROGRESS, 'cerrar')
  }

  /**
   * Valida que se puede crear una auditoría de revisión
   * Requisitos:
   * - La auditoría padre debe estar en estado CLOSED
   *
   * @param parentAudit - Auditoría padre
   * @throws AuditCannotBeRevisedException si no está CLOSED
   */
  validateCanCreateRevision(parentAudit: AuditEntity): void {
    if (!parentAudit.canCreateRevision) {
      throw new AuditCannotBeRevisedException(
        parentAudit.id,
        AuditStatus.CLOSED,
      )
    }
  }

  /**
   * Valida que un template existe y está publicado
   * Una auditoría solo puede crearse con templates en estado PUBLISHED
   *
   * @param templateId - ID del template a validar
   * @throws TemplateNotFoundException si el template no existe
   * @throws BadRequestException si el template no está publicado
   * @returns El template validado
   */
  async validateTemplateIsPublished(templateId: string) {
    const template = await this.templatesRepository.findById(templateId)

    if (!template) {
      throw new TemplateNotFoundException(templateId)
    }

    if (template.status !== TemplateStatus.PUBLISHED) {
      throw new BadRequestException(
        `El template "${template.name}" debe estar en estado PUBLISHED para crear auditorías (estado actual: ${template.status})`,
      )
    }

    return template
  }

  /**
   * Valida que una auditoría esté activa (IN_PROGRESS)
   * para poder actualizar evaluaciones
   *
   * @param audit - Auditoría a validar
   * @throws InvalidAuditStateException si no está IN_PROGRESS
   */
  validateIsActive(audit: AuditEntity): void {
    this.validateAuditStatus(
      audit,
      AuditStatus.IN_PROGRESS,
      'actualizar evaluaciones',
    )
  }

  /**
   * Valida que una auditoría puede ser archivada
   * Requisitos:
   * - Debe estar en estado CLOSED
   *
   * @param audit - Auditoría a validar
   * @throws InvalidAuditStateException si no está CLOSED
   */
  validateCanArchive(audit: AuditEntity): void {
    this.validateAuditStatus(audit, AuditStatus.CLOSED, 'archivar')
  }

  /**
   * Valida las fechas de una auditoría
   * - startDate debe ser anterior a endDate (si ambas existen)
   *
   * @param startDate - Fecha de inicio
   * @param endDate - Fecha de fin
   * @throws BadRequestException si las fechas son inválidas
   */
  validateDates(startDate: Date | null, endDate: Date | null): void {
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      )
    }
  }
}

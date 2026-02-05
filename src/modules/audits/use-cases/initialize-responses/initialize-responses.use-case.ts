import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database'
import { AuditResponseEntity } from '../../entities/audit-response.entity'
import { AuditNotFoundException } from '../../exceptions'
import { ResponseStatus } from '../../enums/response-status.enum'
import { AUDITS_REPOSITORY, AUDIT_RESPONSES_REPOSITORY } from '../../tokens'
import { STANDARDS_REPOSITORY } from '../../../audit-library/standards/tokens'
import type {
  IAuditsRepository,
  IAuditResponsesRepository,
} from '../../repositories'
import type { IStandardsRepository } from '../../../audit-library/standards/repositories'

/**
 * Use Case: Inicializar respuestas de auditoría
 *
 * Responsabilidades:
 * - Obtener todos los standards auditables del template
 * - Crear AuditResponseEntity por cada standard auditable
 * - Copiar weight del standard a la respuesta
 * - Inicializar status = NOT_STARTED
 * - Inicializar todos los campos en null
 *
 * Cuándo ejecutar:
 * - Al crear auditoría (CreateAuditUseCase)
 * - O al iniciar auditoría (StartAuditUseCase)
 *
 * Flujo:
 * 1. Validar que auditoría existe
 * 2. Validar que no tenga respuestas ya creadas (evitar duplicados)
 * 3. Obtener standards auditables del template (isAuditable = true)
 * 4. Crear AuditResponseEntity por cada standard
 * 5. Guardar todas las respuestas en batch
 * 6. Retornar respuestas creadas
 *
 * IMPORTANTE:
 * - Solo crea respuestas para standards con isAuditable = true
 * - Los standards NO auditables (organizadores) NO se copian
 * - El weight se copia del StandardEntity
 * - Todas las respuestas inician en status = NOT_STARTED
 */
@Injectable()
export class InitializeResponsesUseCase {
  constructor(
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
    @Inject(AUDIT_RESPONSES_REPOSITORY)
    private readonly responsesRepository: IAuditResponsesRepository,
    @Inject(STANDARDS_REPOSITORY)
    private readonly standardsRepository: IStandardsRepository,
  ) {}

  @Transactional()
  async execute(auditId: string): Promise<AuditResponseEntity[]> {
    // 1. Validar que la auditoría existe
    const audit = await this.auditsRepository.findById(auditId)
    if (!audit) {
      throw new AuditNotFoundException(auditId)
    }

    // 2. Verificar si ya tiene respuestas creadas (evitar duplicados)
    const existingResponses =
      await this.responsesRepository.findByAudit(auditId)

    if (existingResponses.length > 0) {
      // Ya tiene respuestas, no hacer nada
      return existingResponses
    }

    // 3. Obtener standards auditables del template
    // Solo standards con isAuditable = true
    const auditableStandards =
      await this.standardsRepository.findAuditableByTemplate(audit.templateId)

    if (auditableStandards.length === 0) {
      throw new Error(
        `El template "${audit.templateId}" no tiene standards auditables. Verifica que al menos un standard tenga isAuditable = true.`,
      )
    }

    // 4. Crear AuditResponseEntity por cada standard auditable
    const responses: AuditResponseEntity[] = auditableStandards.map(
      (standard) => {
        const response = new AuditResponseEntity()

        // IDs de relación
        response.auditId = auditId
        response.standardId = standard.id

        // Copiar ponderación del standard
        response.weight = standard.weight

        // Inicializar en NOT_STARTED
        response.status = ResponseStatus.NOT_STARTED

        // Todos los campos de evaluación en null
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
      },
    )

    // 5. Guardar todas las respuestas en batch
    const savedResponses = await this.responsesRepository.saveMany(responses)

    return savedResponses
  }
}

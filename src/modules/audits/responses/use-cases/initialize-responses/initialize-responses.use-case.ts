import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database'
import { AuditResponseEntity } from '../../../entities/audit-response.entity'
import { AUDITS_REPOSITORY, AUDIT_RESPONSES_REPOSITORY } from '../../../tokens'
import { STANDARDS_REPOSITORY } from '../../../../audit-library/standards/tokens'
import type {
  IAuditsRepository,
  IAuditResponsesRepository,
} from '../../../repositories'
import type { IStandardsRepository } from '../../../../audit-library/standards/repositories'
import { AuditValidator } from '../../../core/validators'
import { AuditResponseFactory } from '../../../core/factories'
import { WeightCalculatorService } from '../../../core/services'

/**
 * Use Case: Inicializar respuestas de auditoría
 *
 * Refactorizado para usar:
 * - AuditValidator: Validaciones de auditoría
 * - AuditResponseFactory: Creación de respuestas desde standards
 * - WeightCalculatorService: Validación de ponderaciones
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
    private readonly auditValidator: AuditValidator,
    private readonly responseFactory: AuditResponseFactory,
    private readonly weightCalculator: WeightCalculatorService,
  ) {}

  @Transactional()
  async execute(auditId: string): Promise<AuditResponseEntity[]> {
    // 1. Validar que la auditoría existe
    const audit = await this.auditValidator.validateAndGetAudit(auditId)

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

    // 4. Validar que la suma de pesos sea 100
    this.weightCalculator.validateStandardsWeights(auditableStandards)

    // 5. Crear AuditResponseEntity por cada standard usando factory
    const responses = this.responseFactory.createManyFromStandards(
      auditId,
      auditableStandards,
    )

    // 6. Guardar todas las respuestas en batch
    const savedResponses = await this.responsesRepository.saveMany(responses)

    return savedResponses
  }
}

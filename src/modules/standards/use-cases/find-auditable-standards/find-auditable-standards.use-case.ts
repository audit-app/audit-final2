import { Injectable } from '@nestjs/common'
import { StandardsRepository } from '../../repositories/standards.repository'
import type { StandardEntity } from '../../entities/standard.entity'

/**
 * Find Auditable Standards Use Case
 *
 * Obtiene todos los estándares auditables de una plantilla
 */
@Injectable()
export class FindAuditableStandardsUseCase {
  constructor(private readonly standardsRepository: StandardsRepository) {}

  async execute(templateId: string): Promise<StandardEntity[]> {
    return await this.standardsRepository.findAllStandards({
      where: {
        templateId,
        isAuditable: true,
        isActive: true,
      },
      order: { order: 'ASC' },
    })
  }
}

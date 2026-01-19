import { Injectable } from '@nestjs/common'
import { StandardsRepository } from '../../../repositories/standards.repository'
import type { StandardEntity } from '../../../entities/standard.entity'

/**
 * Find All Standards Use Case
 *
 * Obtiene todos los estándares del sistema
 */
@Injectable()
export class FindAllStandardsUseCase {
  constructor(private readonly standardsRepository: StandardsRepository) {}

  async execute(): Promise<StandardEntity[]> {
    return await this.standardsRepository.findAllStandards({
      relations: ['template', 'parent', 'children'],
      order: { order: 'ASC' },
    })
  }
}

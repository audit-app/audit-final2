import { Injectable } from '@nestjs/common'
import { StandardsRepository } from '../../repositories/standards.repository'
import type { StandardEntity } from '../../entities/standard.entity'

/**
 * Find Standard Children Use Case
 *
 * Obtiene los estándares hijos de un estándar específico
 */
@Injectable()
export class FindStandardChildrenUseCase {
  constructor(private readonly standardsRepository: StandardsRepository) {}

  async execute(parentId: string): Promise<StandardEntity[]> {
    return await this.standardsRepository.findAllStandards({
      where: { parentId },
      relations: ['children'],
      order: { order: 'ASC' },
    })
  }
}

import { Injectable } from '@nestjs/common'
import { StandardsRepository } from '../../repositories/standards.repository'
import { StandardNotFoundException } from '../../exceptions'
import type { StandardEntity } from '../../entities/standard.entity'

/**
 * Find Standard Use Case
 *
 * Busca un estándar por su ID
 */
@Injectable()
export class FindStandardUseCase {
  constructor(private readonly standardsRepository: StandardsRepository) {}

  async execute(id: string): Promise<StandardEntity> {
    const standard = await this.standardsRepository.findOneWithRelations(id)

    if (!standard) {
      throw new StandardNotFoundException(id)
    }

    return standard
  }
}

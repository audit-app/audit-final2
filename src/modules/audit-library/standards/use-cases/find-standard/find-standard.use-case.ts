import { Injectable, Inject } from '@nestjs/common'
import { StandardNotFoundException } from '../../exceptions'
import type { StandardEntity } from '../../entities/standard.entity'
import type { IStandardsRepository } from '../../repositories'
import { STANDARDS_REPOSITORY } from '../../tokens'

/**
 * Find Standard Use Case
 *
 * Busca un estándar por su ID
 */
@Injectable()
export class FindStandardUseCase {
  constructor(
    @Inject(STANDARDS_REPOSITORY)
    private readonly standardsRepository: IStandardsRepository,
  ) {}

  async execute(id: string): Promise<StandardEntity> {
    const standard = await this.standardsRepository.findById(id)

    if (!standard) {
      throw new StandardNotFoundException(id)
    }

    return standard
  }
}

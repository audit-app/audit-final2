import { Inject, Injectable } from '@nestjs/common'

import { MaturityFrameworkNotFoundException } from '../../../exceptions'
import type { MaturityLevelEntity } from '../../../entities/maturity-level.entity'
import { FRAMEWORKS_REPOSITORY } from 'src/modules/maturity/frameworks'
import type { IFrameworksRepository } from 'src/modules/maturity/frameworks'
import type { IMaturityLevelsRepository } from '../../../repositories'
import { LEVELS_REPOSITORY } from '../../../tokens'

/**
 * Find Levels By Framework Use Case
 *
 * Obtiene todos los niveles de un framework ordenados
 */
@Injectable()
export class FindLevelsByFrameworkUseCase {
  constructor(
    @Inject(FRAMEWORKS_REPOSITORY)
    private readonly frameworksRepository: IFrameworksRepository,
    @Inject(LEVELS_REPOSITORY)
    private readonly levelsRepository: IMaturityLevelsRepository,
  ) {}

  /**
   * Ejecuta la búsqueda de niveles
   *
   * @param frameworkId - ID del framework
   * @returns Lista de niveles ordenados por orden
   * @throws {MaturityFrameworkNotFoundException} Si el framework no existe
   */
  async execute(frameworkId: string): Promise<MaturityLevelEntity[]> {
    // 1. Verificar que el framework existe
    const framework = await this.frameworksRepository.findById(frameworkId)

    if (!framework) {
      throw new MaturityFrameworkNotFoundException(frameworkId)
    }

    // 2. Obtener los niveles
    const levels = await this.levelsRepository.findByFramework(frameworkId)

    return levels
  }
}

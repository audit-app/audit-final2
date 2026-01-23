import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { IMaturityLevelsRepository } from '../../../repositories'
import type { MaturityLevelEntity } from '../../../entities/maturity-level.entity'
import { LEVELS_REPOSITORY } from '../../../tokens'

/**
 * Find Level Use Case
 *
 * Obtiene un nivel de madurez específico por su ID
 */
@Injectable()
export class FindLevelUseCase {
  constructor(
    @Inject(LEVELS_REPOSITORY)
    private readonly levelsRepository: IMaturityLevelsRepository,
  ) {}

  /**
   * Ejecuta la búsqueda de un nivel
   *
   * @param id - ID del nivel
   * @returns Nivel de madurez encontrado
   * @throws {NotFoundException} Si el nivel no existe
   */
  async execute(id: string): Promise<MaturityLevelEntity> {
    const level = await this.levelsRepository.findById(id)

    if (!level) {
      throw new NotFoundException(
        `Nivel de madurez con ID "${id}" no encontrado`,
      )
    }

    return level
  }
}

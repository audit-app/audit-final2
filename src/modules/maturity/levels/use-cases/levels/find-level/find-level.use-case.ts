import { Injectable, NotFoundException } from '@nestjs/common'
import { MaturityLevelsRepository } from '../../../repositories'
import type { MaturityLevelEntity } from '../../../entities/maturity-level.entity'

/**
 * Find Level Use Case
 *
 * Obtiene un nivel de madurez específico por su ID
 */
@Injectable()
export class FindLevelUseCase {
  constructor(
    private readonly levelsRepository: MaturityLevelsRepository,
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

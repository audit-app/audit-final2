import { Inject, Injectable } from '@nestjs/common'
import type { IFrameworksRepository } from '../../repositories'
import { MaturityFrameworkNotFoundException } from '../../exceptions'
import type { MaturityFrameworkEntity } from '../../entities/maturity-framework.entity'
import { FRAMEWORKS_REPOSITORY } from '../../tokens'

/**
 * Find Maturity Framework Use Case
 *
 * Busca un framework de madurez por ID con sus niveles
 */
@Injectable()
export class FindFrameworkUseCase {
  constructor(
    @Inject(FRAMEWORKS_REPOSITORY)
    private readonly frameworksRepository: IFrameworksRepository,
  ) {}

  /**
   * Ejecuta la búsqueda del framework
   *
   * @param id - ID del framework a buscar
   * @param withLevels - Si se deben incluir los niveles (default: true)
   * @returns Framework encontrado con sus niveles
   * @throws {MaturityFrameworkNotFoundException} Si el framework no existe
   */
  async execute(
    id: string,
    withLevels: boolean = true,
  ): Promise<MaturityFrameworkEntity> {
    const framework = withLevels
      ? await this.frameworksRepository.findOneWithLevels(id)
      : await this.frameworksRepository.findById(id)

    if (!framework) {
      throw new MaturityFrameworkNotFoundException(id)
    }

    return framework
  }
}

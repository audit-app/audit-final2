import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common'
import type { IFrameworksRepository } from '../repositories'
import { MaturityFrameworkEntity } from '../entities'
import { FRAMEWORKS_REPOSITORY } from '../tokens'

@Injectable()
export class FrameworkDomainValidator {
  constructor(
    @Inject(FRAMEWORKS_REPOSITORY)
    private readonly frameworkRepository: IFrameworksRepository,
  ) {}

  /**
   * REUTILIZABLE 1: Busca por ID o lanza error.
   * Úsalo en: getById, update, delete, addLevels.
   */
  async validateExistsOrThrow(id: string): Promise<MaturityFrameworkEntity> {
    const framework = await this.frameworkRepository.findById(id)
    if (!framework) {
      // Usar tu excepción personalizada aquí si la tienes
      throw new NotFoundException(`El Framework con ID ${id} no existe.`)
    }
    return framework
  }

  /**
   * REUTILIZABLE 2: Valida que el nombre no esté duplicado.
   * Úsalo en: create, update.
   * * @param name El nombre a verificar
   * @param excludeId (Opcional) El ID del framework actual si estamos editando.
   * Sirve para que no de error si el nombre es el mismo del propio framework.
   */
  async validateUniqueCode(name: string, excludeId?: string): Promise<void> {
    const existing = await this.frameworkRepository.findByCode(name.trim())

    if (existing) {
      if (excludeId && existing.id === excludeId) {
        return
      }

      throw new ConflictException(
        `Ya existe un Framework de Madurez con el nombre "${name}".`,
      )
    }
  }
}

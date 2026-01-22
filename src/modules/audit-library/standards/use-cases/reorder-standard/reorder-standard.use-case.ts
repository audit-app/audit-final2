import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import { StandardValidator } from '../../validators'
import { STANDARDS_REPOSITORY } from '@core'
import type { StandardsRepository } from '../../repositories/standards.repository'
import type { ReorderStandardDto } from '../../dtos/reorder-standard.dto'
import type { StandardEntity } from '../../entities/standard.entity'

/**
 * Reorder Standard Use Case
 *
 * Cambia el orden de visualización de un standard (útil para drag & drop)
 *
 * Reglas de negocio:
 * - El standard debe existir
 * - El template debe ser editable (DRAFT)
 * - El nuevo orden debe ser válido (>= 0)
 */
@Injectable()
export class ReorderStandardUseCase {
  constructor(
    @Inject(STANDARDS_REPOSITORY)
    private readonly standardsRepository: StandardsRepository,
    private readonly standardValidator: StandardValidator,
  ) {}

  /**
   * Ejecuta el cambio de orden
   *
   * @param id - ID del standard
   * @param dto - Nuevo orden
   * @returns Standard actualizado
   * @throws {StandardNotFoundException} Si el standard no existe
   * @throws {StandardCannotModifyStructureException} Si no se puede modificar la estructura
   */
  @Transactional()
  async execute(id: string, dto: ReorderStandardDto): Promise<StandardEntity> {
    // 1. Validar y obtener standard
    const standard = await this.standardValidator.validateAndGetStandard(id)

    // 2. Verificar que se puede modificar la estructura (reordenar standards)
    await this.standardValidator.validateCanModifyStructure(standard.templateId)

    // 3. Actualizar el orden
    standard.order = dto.newOrder

    // 4. Guardar
    return await this.standardsRepository.save(standard)
  }
}

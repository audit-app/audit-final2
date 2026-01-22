import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import { StandardValidator } from '../../validators'
import { STANDARDS_REPOSITORY } from '@core'
import type { StandardsRepository } from '../../repositories/standards.repository'

/**
 * Delete Standard Use Case
 *
 * Elimina un standard permanentemente (hard delete)
 *
 * Reglas de negocio:
 * - El standard debe existir
 * - El template debe estar en DRAFT (no se puede eliminar si está PUBLISHED)
 * - El standard no debe tener hijos
 *
 * Nota: Se usa hard delete porque:
 * - Evita problemas de validación de código único con registros soft-deleted
 * - En DRAFT se puede eliminar y recrear libremente
 * - En PUBLISHED no se permite eliminar (por validación)
 */
@Injectable()
export class DeleteStandardUseCase {
  constructor(
    @Inject(STANDARDS_REPOSITORY)
    private readonly standardsRepository: StandardsRepository,
    private readonly standardValidator: StandardValidator,
  ) {}

  /**
   * Ejecuta la eliminación del standard
   *
   * @param id - ID del standard
   * @throws {StandardNotFoundException} Si el standard no existe
   * @throws {StandardCannotModifyStructureException} Si no se puede modificar la estructura
   * @throws {StandardHasChildrenException} Si el standard tiene hijos
   */
  @Transactional()
  async execute(id: string): Promise<void> {
    // 1. Validar y obtener standard
    const standard = await this.standardValidator.validateAndGetStandard(id)

    // 2. Verificar que se puede modificar la estructura (eliminar standards)
    await this.standardValidator.validateCanModifyStructure(standard.templateId)

    // 3. Verificar que no tenga hijos
    await this.standardValidator.validateHasNoChildren(id)

    // 4. Eliminar permanentemente (hard delete)
    // No usamos soft delete para evitar problemas con validación de códigos únicos
    await this.standardsRepository.delete(id)
  }
}

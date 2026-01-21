import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import { StandardValidator } from '../../validators'
import { STANDARDS_REPOSITORY } from '@core'
import type { StandardsRepository } from '../../repositories/standards.repository'

/**
 * Delete Standard Use Case
 *
 * Elimina un standard (soft delete)
 *
 * Reglas de negocio:
 * - El standard debe existir
 * - El template debe ser editable
 * - El standard no debe tener hijos
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
   * @throws {TemplateNotEditableException} Si el template no es editable
   * @throws {StandardHasChildrenException} Si el standard tiene hijos
   */
  @Transactional()
  async execute(id: string): Promise<void> {
    // 1. Validar y obtener standard
    const standard =
      await this.standardValidator.validateAndGetStandard(id)

    // 2. Verificar que el template es editable
    await this.standardValidator.validateAndGetEditableTemplate(
      standard.templateId,
    )

    // 3. Verificar que no tenga hijos
    await this.standardValidator.validateHasNoChildren(id)

    // 4. Eliminar (soft delete)
    await this.standardsRepository.softDelete(id)
  }
}

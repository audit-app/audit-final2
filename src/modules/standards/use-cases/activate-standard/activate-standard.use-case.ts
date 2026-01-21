import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import { STANDARDS_REPOSITORY } from '@core'
import type { StandardsRepository } from '../../repositories/standards.repository'
import { StandardValidator } from '../../validators'
import type { StandardEntity } from '../../entities/standard.entity'

/**
 * Activate Standard Use Case
 *
 * Activa un estándar (cambia isActive a true)
 *
 * Reglas de negocio:
 * - El standard debe existir
 * - El template debe ser editable
 */
@Injectable()
export class ActivateStandardUseCase {
  constructor(
    @Inject(STANDARDS_REPOSITORY)
    private readonly standardsRepository: StandardsRepository,
    private readonly standardValidator: StandardValidator,
  ) {}

  /**
   * Ejecuta la activación del standard
   *
   * @param id - ID del standard
   * @returns Standard activado
   * @throws {StandardNotFoundException} Si el standard no existe
   * @throws {TemplateNotEditableException} Si el template no es editable
   */
  @Transactional()
  async execute(id: string): Promise<StandardEntity> {
    // 1. Validar y obtener standard
    const standard = await this.standardValidator.validateAndGetStandard(id)

    // 2. Verificar que el template es editable
    await this.standardValidator.validateAndGetEditableTemplate(
      standard.templateId,
    )

    // 3. Activar el estándar
    return await this.standardsRepository.patch(standard, { isActive: true })
  }
}

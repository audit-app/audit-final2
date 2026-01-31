import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import { StandardValidator } from '../../validators'
import { STANDARDS_REPOSITORY } from '../../tokens'
import type { ToggleAuditableDto } from '../../dtos/toggle-auditable.dto'
import type { StandardEntity } from '../../entities/standard.entity'
import type { IStandardsRepository } from '../../repositories'

/**
 * Toggle Auditable Use Case
 *
 * Activa o desactiva si un standard es auditable
 *
 * Casos de uso:
 * - isAuditable = true: Control específico que se puede auditar
 * - isAuditable = false: Agrupador organizacional (solo título/sección)
 *
 * Reglas de negocio:
 * - El standard debe existir
 * - El template debe ser editable (DRAFT)
 */
@Injectable()
export class ActivateAuditableUseCase {
  constructor(
    @Inject(STANDARDS_REPOSITORY)
    private readonly standardsRepository: IStandardsRepository,
    private readonly standardValidator: StandardValidator,
  ) {}

  /**
   * Ejecuta el cambio de isAuditable
   *
   * @param id - ID del standard
   * @param dto - Nuevo valor de isAuditable
   * @returns Standard actualizado
   * @throws {StandardNotFoundException} Si el standard no existe
   * @throws {StandardCannotModifyStructureException} Si no se puede modificar la estructura
   * @throws {StandardWithChildrenCannotBeAuditableException} Si tiene hijos y se intenta marcar como auditable
   * @throws {StandardWeightSumExceededException} Si la suma de pesos excede 100
   */
  @Transactional()
  async execute(id: string): Promise<StandardEntity> {
    // 1. Validar y obtener standard
    const standard = await this.standardValidator.validateAndGetStandard(id)

    // 2. Verificar que se puede modificar la estructura (cambiar funcionalidad del standard)
    await this.standardValidator.validateCanModifyStructure(standard.templateId)

    // 3. Validar que puede ser auditable (si tiene hijos, solo puede ser agrupador)
    await this.standardValidator.validateCanBeAuditable(id, true)

    // 4. Validar suma de pesos (al activar como auditable, su weight se suma al total)
    await this.standardValidator.validateWeightSum(
      standard.templateId,
      standard.weight,
      true,
      id, // Excluir este standard del cálculo
    )

    // 5. Actualizar isAuditable
    standard.isAuditable = true

    // 6. Guardar
    return await this.standardsRepository.save(standard)
  }
}

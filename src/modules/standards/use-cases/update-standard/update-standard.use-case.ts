import { Inject, Injectable, BadRequestException } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import type { UpdateStandardDto } from '../../dtos/update-standard.dto'
import type { StandardEntity } from '../../entities/standard.entity'
import { StandardFactory } from '../../factories'
import { StandardValidator } from '../../validators'
import { STANDARDS_REPOSITORY } from '@core'
import type { StandardsRepository } from '../../repositories/standards.repository'

/**
 * Update Standard Use Case
 *
 * Actualiza un standard existente
 *
 * Reglas de negocio:
 * - El standard debe existir
 * - El template del standard debe ser editable
 * - No puede establecerse a sí mismo como padre
 * - Si cambia el padre, recalcular nivel
 * - Si cambia el código, debe ser único dentro del template
 */
@Injectable()
export class UpdateStandardUseCase {
  constructor(
    @Inject(STANDARDS_REPOSITORY)
    private readonly standardsRepository: StandardsRepository,
    private readonly standardFactory: StandardFactory,
    private readonly standardValidator: StandardValidator,
  ) {}

  /**
   * Ejecuta la actualización del standard
   *
   * @param id - ID del standard
   * @param dto - Datos a actualizar
   * @returns Standard actualizado
   * @throws {StandardNotFoundException} Si el standard no existe
   * @throws {TemplateNotEditableException} Si el template no es editable
   * @throws {BadRequestException} Si intenta establecerse como su propio padre
   */
  @Transactional()
  async execute(id: string, dto: UpdateStandardDto): Promise<StandardEntity> {
    // 1. Validar y obtener standard
    const standard =
      await this.standardValidator.validateAndGetStandard(id)

    // 2. Verificar que el template es editable
    await this.standardValidator.validateAndGetEditableTemplate(
      standard.templateId,
    )

    // 3. Validar que no se establezca a sí mismo como padre
    if (dto.parentId && dto.parentId === id) {
      throw new BadRequestException('Un standard no puede ser su propio padre')
    }

    // 4. Validar código único si se está cambiando
    if (dto.code !== undefined && dto.code !== standard.code) {
      await this.standardValidator.validateUniqueCode(
        standard.templateId,
        dto.code,
        id, // Excluir el propio standard
      )
    }

    // 5. Recalcular nivel si cambia el padre
    if (dto.parentId !== undefined && dto.parentId !== standard.parentId) {
      if (dto.parentId) {
        const parentLevel =
          await this.standardValidator.validateParentAndGetLevel(dto.parentId)
        standard.level = parentLevel + 1
      } else {
        standard.level = 1
      }
      standard.parentId = dto.parentId
    }

    // 6. Actualizar campos usando factory
    const updatedStandard = this.standardFactory.updateFromDto(standard, dto)

    // 7. Guardar cambios
    return await this.standardsRepository.save(updatedStandard)
  }
}

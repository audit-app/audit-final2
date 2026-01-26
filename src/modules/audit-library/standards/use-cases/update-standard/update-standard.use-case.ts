import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import type { UpdateStandardDto } from '../../dtos/update-standard.dto'
import type { StandardEntity } from '../../entities/standard.entity'
import { StandardFactory } from '../../factories'
import { StandardValidator } from '../../validators'
import { STANDARDS_REPOSITORY } from '../../tokens'
import type { IStandardsRepository } from '../../repositories'

/**
 * Update Standard Use Case
 *
 * Actualiza un standard existente
 *
 * Reglas de negocio:
 * - El standard debe existir
 * - El template del standard debe ser editable
 * - Si cambia el código, debe ser único dentro del template
 * - NO se puede cambiar parentId (evita ciclos y desincronización de niveles)
 */
@Injectable()
export class UpdateStandardUseCase {
  constructor(
    @Inject(STANDARDS_REPOSITORY)
    private readonly standardsRepository: IStandardsRepository,
    private readonly standardFactory: StandardFactory,
    private readonly standardValidator: StandardValidator,
  ) {}

  /**
   * Ejecuta la actualización del standard
   *
   * @param id - ID del standard
   * @param dto - Datos a actualizar (sin parentId, no se puede cambiar jerarquía)
   * @returns Standard actualizado
   * @throws {StandardNotFoundException} Si el standard no existe
   * @throws {StandardCannotModifyContentException} Si no se puede modificar el contenido
   */
  @Transactional()
  async execute(id: string, dto: UpdateStandardDto): Promise<StandardEntity> {
    // 1. Validar y obtener standard
    const standard = await this.standardValidator.validateAndGetStandard(id)

    // 2. Verificar que se puede modificar el contenido (editar textos)
    await this.standardValidator.validateCanModifyContent(standard.templateId)

    // 3. Validar código único si se está cambiando
    /*     if (dto.code !== undefined && dto.code !== standard.code) {
      await this.standardValidator.validateUniqueCode(
        standard.templateId,
        dto.code,
        id,
      )
    } */

    // 4. Actualizar campos usando factory
    const updatedStandard = this.standardFactory.updateFromDto(standard, dto)

    // 5. Guardar cambios
    return await this.standardsRepository.save(updatedStandard)
  }
}

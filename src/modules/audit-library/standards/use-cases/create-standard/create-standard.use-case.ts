import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import type { CreateStandardDto } from '../../dtos/create-standard.dto'
import type { StandardEntity } from '../../entities/standard.entity'
import { StandardFactory } from '../../factories'
import { StandardValidator } from '../../validators'

import type { IStandardsRepository } from '../../repositories'
import { STANDARDS_REPOSITORY } from '../../tokens'

/**
 * Create Standard Use Case
 *
 * Crea un nuevo standard dentro de un template
 *
 * Campos automáticos (NO vienen en el DTO):
 * - level: Se calcula automáticamente (padre.level + 1, o 1 si es raíz)
 * - order: Se calcula automáticamente al final de la lista de hermanos
 * - isAuditable: Por defecto false (agrupador). Cambiar con endpoint específico
 *
 * Reglas de negocio:
 * - El template debe existir y ser editable (DRAFT)
 * - Si tiene padre, el padre debe existir
 * - El código debe ser único dentro del template
 */
@Injectable()
export class CreateStandardUseCase {
  constructor(
    @Inject(STANDARDS_REPOSITORY)
    private readonly standardsRepository: IStandardsRepository,
    private readonly standardFactory: StandardFactory,
    private readonly standardValidator: StandardValidator,
  ) {}

  /**
   * Ejecuta la creación del standard
   *
   * @param dto - Datos del standard
   * @returns Standard creado
   * @throws {TemplateNotFoundException} Si el template no existe
   * @throws {StandardCannotModifyStructureException} Si no se puede modificar la estructura
   * @throws {StandardNotFoundException} Si el padre no existe
   */
  @Transactional()
  async execute(dto: CreateStandardDto): Promise<StandardEntity> {
    // 1. Verificar que se puede modificar la estructura (crear standards)
    await this.standardValidator.validateCanModifyStructure(dto.templateId)

    // 2. Validar código único dentro del template
    await this.standardValidator.validateUniqueCode(dto.templateId, dto.code)

    // 3. Calcular el nivel
    let level = 1
    if (dto.parentId) {
      const parentLevel =
        await this.standardValidator.validateParentAndGetLevel(dto.parentId)
      level = parentLevel + 1
    }

    // 4. Calcular el orden automáticamente al final de la lista
    const maxOrder = await this.standardsRepository.getMaxOrderByParent(
      dto.templateId,
      dto.parentId ?? null,
    )
    const order = maxOrder + 1

    // 5. Crear el standard usando factory
    const standard = this.standardFactory.createFromDto(dto, level, order)

    // 6. Guardar
    return await this.standardsRepository.save(standard)
  }
}

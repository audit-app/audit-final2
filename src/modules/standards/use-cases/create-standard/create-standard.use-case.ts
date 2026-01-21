import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import type { CreateStandardDto } from '../../dtos/create-standard.dto'
import type { StandardEntity } from '../../entities/standard.entity'
import { StandardFactory } from '../../factories'
import { StandardValidator } from '../../validators'
import { STANDARDS_REPOSITORY } from '@core'
import type { StandardsRepository } from '../../repositories/standards.repository'

/**
 * Create Standard Use Case
 *
 * Crea un nuevo standard dentro de un template
 *
 * Reglas de negocio:
 * - El template debe existir y ser editable
 * - Si tiene padre, el padre debe existir
 * - El nivel se calcula automáticamente (padre.level + 1)
 * - El código debe ser único dentro del template
 */
@Injectable()
export class CreateStandardUseCase {
  constructor(
    @Inject(STANDARDS_REPOSITORY)
    private readonly standardsRepository: StandardsRepository,
    private readonly standardFactory: StandardFactory,
    private readonly standardValidator: StandardValidator,
  ) {}

  /**
   * Ejecuta la creación del standard
   *
   * @param dto - Datos del standard
   * @returns Standard creado
   * @throws {TemplateNotFoundException} Si el template no existe
   * @throws {TemplateNotEditableException} Si el template no es editable
   * @throws {StandardNotFoundException} Si el padre no existe
   */
  @Transactional()
  async execute(dto: CreateStandardDto): Promise<StandardEntity> {
    // 1. Verificar que el template existe y es editable
    await this.standardValidator.validateAndGetEditableTemplate(dto.templateId)

    // 2. Validar código único dentro del template
    await this.standardValidator.validateUniqueCode(dto.templateId, dto.code)

    // 3. Calcular el nivel
    let level = 1
    if (dto.parentId) {
      const parentLevel =
        await this.standardValidator.validateParentAndGetLevel(dto.parentId)
      level = parentLevel + 1
    }

    // 4. Crear el standard usando factory
    const standard = this.standardFactory.createFromDto(dto, level)

    // 5. Guardar
    return await this.standardsRepository.save(standard)
  }
}

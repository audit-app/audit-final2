import { Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import { MaturityFrameworksRepository } from '../../../repositories'
import {
  MaturityFrameworkAlreadyExistsException,
  InvalidLevelRangeException,
} from '../../../exceptions'
import type { CreateMaturityFrameworkDto } from '../../../dtos'
import type { MaturityFrameworkEntity } from '../../../entities/maturity-framework.entity'
import { MaturityLevelsIntegrityValidator } from '../../../validators'

/**
 * Create Maturity Framework Use Case
 *
 * Crea un nuevo framework de madurez con opción de creación atómica
 *
 * Reglas de negocio:
 * - El código del framework debe ser único
 * - El nivel mínimo debe ser menor que el nivel máximo
 * - Si se proporcionan levels, se valida integridad (secuencia completa sin huecos)
 * - Por defecto se crea como activo
 * - Cascade de TypeORM guarda framework + levels en una sola transacción
 */
@Injectable()
export class CreateFrameworkUseCase {
  constructor(
    private readonly frameworksRepository: MaturityFrameworksRepository,
    private readonly levelsIntegrityValidator: MaturityLevelsIntegrityValidator,
  ) {}

  /**
   * Ejecuta la creación del framework
   *
   * @param dto - Datos del framework a crear (con niveles opcionales)
   * @returns Framework creado (con niveles si se proporcionaron)
   * @throws {MaturityFrameworkAlreadyExistsException} Si ya existe un framework con ese código
   * @throws {InvalidLevelRangeException} Si el rango de niveles es inválido
   * @throws {BadRequestException} Si los niveles no cumplen validaciones de integridad
   */
  @Transactional()
  async execute(
    dto: CreateMaturityFrameworkDto,
  ): Promise<MaturityFrameworkEntity> {
    // 1. Verificar que no exista un framework con ese código
    const existingFramework = await this.frameworksRepository.findByCode(
      dto.code,
    )

    if (existingFramework) {
      throw new MaturityFrameworkAlreadyExistsException(dto.code)
    }

    // 2. Validar rango de niveles
    const minLevel = dto.minLevel ?? 0
    const maxLevel = dto.maxLevel ?? 5

    if (minLevel >= maxLevel) {
      throw new InvalidLevelRangeException(minLevel, maxLevel)
    }

    // 3. Si se proporcionan levels, validar integridad
    if (dto.levels && dto.levels.length > 0) {
      this.levelsIntegrityValidator.validate(dto.levels, minLevel, maxLevel)

      // Asignar order automáticamente si no se especifica
      dto.levels.forEach((level) => {
        if (level.order === undefined) {
          level.order = level.level
        }
      })
    }

    // 4. Crear el framework (TypeORM cascade guardará los levels automáticamente)
    const framework = await this.frameworksRepository.save({
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
      minLevel,
      maxLevel,
      isActive: dto.isActive ?? true,
      levels: dto.levels, // TypeORM cascade: true se encarga del resto
    })

    return framework
  }
}

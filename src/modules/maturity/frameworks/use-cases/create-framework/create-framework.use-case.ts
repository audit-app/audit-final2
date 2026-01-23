import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import type { IFrameworksRepository } from '../../repositories'
import { InvalidLevelRangeException } from '../../exceptions'
import type { CreateMaturityFrameworkDto } from '../../dtos'
import type { MaturityFrameworkEntity } from '../../entities/maturity-framework.entity'
import {
  LevelSequenceValidator,
  FrameworkDomainValidator,
} from '../../validators'
import { FRAMEWORKS_REPOSITORY } from '../../tokens'
import { FrameworkFactory } from '../../factories'
import { MaturityLevelFactory } from 'src/modules/maturity/levels/factories'
import { LEVELS_REPOSITORY } from 'src/modules/maturity/levels'
import type { IMaturityLevelsRepository } from 'src/modules/maturity/levels'

@Injectable()
export class CreateFrameworkUseCase {
  constructor(
    @Inject(FRAMEWORKS_REPOSITORY)
    private readonly frameworksRepository: IFrameworksRepository,
    @Inject(LEVELS_REPOSITORY)
    private readonly levelRepository: IMaturityLevelsRepository,

    private readonly levelsIntegrityValidator: LevelSequenceValidator,
    private readonly FrameworkDomainValidator: FrameworkDomainValidator,
    private readonly frameworkFactory: FrameworkFactory,
    private readonly levelFactory: MaturityLevelFactory,
  ) {}

  /**
   * Ejecuta la creación del framework
   *
   * @param dto - Datos del framework a crear (con niveles OBLIGATORIOS)
   * @returns Framework creado con sus niveles
   * @throws {MaturityFrameworkAlreadyExistsException} Si ya existe un framework con ese código
   * @throws {InvalidLevelRangeException} Si el rango de niveles es inválido
   * @throws {BadRequestException} Si los niveles no cumplen validaciones de integridad
   */
  @Transactional()
  async execute(
    dto: CreateMaturityFrameworkDto,
  ): Promise<MaturityFrameworkEntity> {
    // 1. Verificar que no exista un framework con ese código
    await this.FrameworkDomainValidator.validateUniqueCode(dto.code)

    if (dto.minLevel >= dto.maxLevel) {
      throw new InvalidLevelRangeException(dto.minLevel, dto.maxLevel)
    }

    // 3. Validar integridad de los levels (OBLIGATORIO)
    this.levelsIntegrityValidator.verifySequence(
      dto.levels,
      dto.minLevel,
      dto.maxLevel,
    )

    dto.levels.forEach((level) => {
      if (level.order === undefined) {
        level.order = level.level
      }
    })
    const framework = this.frameworkFactory.createFromDto(dto)
    const savedFramework = await this.frameworksRepository.save(framework)
    const data = this.frameworkFactory.createManyFromNestedDtos(
      dto.levels,
      savedFramework,
    )
    await this.levelRepository.saveMany(data)

    return savedFramework
  }
}

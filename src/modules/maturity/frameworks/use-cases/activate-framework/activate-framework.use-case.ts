import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import { FrameworkDomainValidator } from '../../validators'
import type { IFrameworksRepository } from '../../repositories'
import { FRAMEWORKS_REPOSITORY } from '../../tokens'
import { MaturityFrameworkEntity } from '../../entities'

/**
 * Activate/Deactivate Maturity Framework Use Case
 *
 * Activa o desactiva un framework de madurez
 *
 * Frameworks inactivos no pueden ser asignados a nuevas plantillas/auditorías
 */
@Injectable()
export class ActivateFrameworkUseCase {
  constructor(
    @Inject(FRAMEWORKS_REPOSITORY)
    private readonly frameworksRepository: IFrameworksRepository,
    private readonly frameworkValidator: FrameworkDomainValidator,
  ) {}

  @Transactional()
  async execute(id: string): Promise<MaturityFrameworkEntity> {
    const framework = await this.frameworkValidator.validateExistsOrThrow(id)
    framework.activate()
    return this.frameworksRepository.save(framework)
  }
}

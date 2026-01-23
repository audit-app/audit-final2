import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import type { IFrameworksRepository } from '../../repositories'
import type { UpdateMaturityFrameworkDto } from '../../dtos'
import type { MaturityFrameworkEntity } from '../../entities/maturity-framework.entity'
import { FRAMEWORKS_REPOSITORY } from '../../tokens'
import { FrameworkDomainValidator } from '../../validators'
import { FrameworkFactory } from '../../factories'

@Injectable()
export class UpdateFrameworkUseCase {
  constructor(
    @Inject(FRAMEWORKS_REPOSITORY)
    private readonly frameworksRepository: IFrameworksRepository,
    private readonly frameworkFactory: FrameworkFactory,
    private readonly frameworkValidator: FrameworkDomainValidator,
  ) {}

  @Transactional()
  async execute(
    id: string,
    dto: UpdateMaturityFrameworkDto,
  ): Promise<MaturityFrameworkEntity> {
    const framework = await this.frameworkValidator.validateExistsOrThrow(id)
    if (dto.code && dto.code !== framework.code) {
      await this.frameworkValidator.validateUniqueCode(dto.code)
    }
    const updated = this.frameworkFactory.updateFromDto(framework, dto)
    return this.frameworksRepository.save(updated)
  }
}

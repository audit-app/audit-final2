import { Injectable, Inject } from '@nestjs/common'
import { Transactional } from '@core/database'
import { LoggerService } from '@core/logger'
import { CreateUserDto } from './create-user.dto'
import { UserEntity } from '../../entities/user.entity'
import { UserValidator } from '../../validators/user.validator'
import { UserFactory } from '../../factories/user.factory'
import { EmailVerificationService } from '../../services'
import { USERS_REPOSITORY } from '../../tokens'
import type { IUsersRepository } from '../../repositories'
import {
  type IOrganizationRepository,
  ORGANIZATION_REPOSITORY,
  OrganizationNotFoundException,
} from 'src/modules/organizations'

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    private readonly validator: UserValidator,
    private readonly userFactory: UserFactory,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly logger: LoggerService,
  ) {}

  @Transactional()
  async execute(dto: CreateUserDto): Promise<UserEntity> {
    this.validator.validateRoles(dto.roles)
    await this.validator.validateUniqueConstraints(
      dto.email,
      dto.username,
      dto.ci,
    )

    const organization = await this.organizationRepository.findById(
      dto.organizationId,
    )

    if (!organization) {
      throw new OrganizationNotFoundException(dto.organizationId)
    }

    const user = this.userFactory.createFromDto(dto)
    const savedUser = await this.usersRepository.save(user)

    try {
      await this.emailVerificationService.generateAndSendInvitation(
        savedUser.id,
      )
      this.logger.log(
        `Email de invitación enviado a ${savedUser.email} (userId: ${savedUser.id})`,
      )
    } catch (error) {
      this.logger.error(
        `Error al enviar email de invitación a ${savedUser.email}:`,
        error instanceof Error ? error.stack : String(error),
      )
    }

    return savedUser
  }
}

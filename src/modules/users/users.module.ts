import { Module } from '@nestjs/common'
import { UsersController } from './controllers/users.controller'
import { UserValidator } from './validators/user.validator'
import { UserFactory } from './factories/user.factory'
import {
  CreateUserUseCase,
  UpdateUserUseCase,
  FindAllUsersUseCase,
  FindUserByIdUseCase,
  UploadProfileImageUseCase,
  DeleteProfileImageUseCase,
  DeactivateUserUseCase,
  RemoveUserUseCase,
  ActivateUserUseCase,
  TwoFactorActivateUserUseCase,
  TwoFactorDeactivateUserUseCase,
} from './use-cases'

@Module({
  imports: [],
  controllers: [UsersController],
  providers: [
    // Use Cases
    CreateUserUseCase,
    UpdateUserUseCase,
    FindAllUsersUseCase,
    FindUserByIdUseCase,
    UploadProfileImageUseCase,
    DeleteProfileImageUseCase,
    DeactivateUserUseCase,
    RemoveUserUseCase,
    ActivateUserUseCase,
    TwoFactorActivateUserUseCase,
    TwoFactorDeactivateUserUseCase,
    // Infrastructure
    UserValidator,
    UserFactory,
  ],
  exports: [
    // Exportar para uso en otros módulos (ej: AuthModule)
    UserValidator,
  ],
})
export class UsersModule {}

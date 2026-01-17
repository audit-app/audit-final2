import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import {
  ApiCreate,
  ApiList,
  ApiFindOne,
  ApiUpdate,
  ApiRemove,
  ApiCustom,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiStandardResponses,
} from '@core/swagger'
import { UuidParamDto } from '@core/dtos'

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
  VerifyEmailUseCase,
  ResendInvitationUseCase,
} from '../use-cases'
import { CreateUserDto, UpdateUserDto, VerifyEmailDto } from '../dtos'
import { UserStatus, Role, UserEntity } from '../entities/user.entity'
import { UploadAvatar } from '@core/files'
import { Public } from '../../auth'
import {
  FindUsersDto,
  USER_SORTABLE_FIELDS,
  USER_SEARCH_FIELDS,
} from '../dtos/find-users.dto'
import { UserResponseDto } from '../dtos/user-response.dto'

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly uploadProfileImageUseCase: UploadProfileImageUseCase,
    private readonly deleteProfileImageUseCase: DeleteProfileImageUseCase,
    private readonly removeUserUseCase: RemoveUserUseCase,
    private readonly activateUserUseCase: ActivateUserUseCase,
    private readonly deactivateUserUseCase: DeactivateUserUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendInvitationUseCase: ResendInvitationUseCase,
  ) {}

  @Post()
  @ApiCreate(UserResponseDto, {
    summary: 'Crear un nuevo usuario',
    description:
      'Crea un nuevo usuario con sus datos básicos. La contraseña se hashea automáticamente con bcrypt.',
    conflictMessage: 'Ya existe un usuario con ese email, username o CI',
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.createUserUseCase.execute(createUserDto)
  }

  @Get()
  @ApiList(UserEntity, {
    summary: 'Listar todos los usuarios',
    searchFields: USER_SEARCH_FIELDS,
    sortableFields: USER_SORTABLE_FIELDS.map(String),
    defaultSortBy: 'createdAt',
    filterFields: [
      {
        name: 'status',
        description: 'Filtrar por estado del usuario',
        type: `enum: ${Object.values(UserStatus).join(', ')}`,
      },
      {
        name: 'role',
        description: 'Filtrar por rol',
        type: `enum: ${Object.values(Role).join(', ')}`,
      },
      {
        name: 'organizationId',
        description: 'Filtrar por ID de organización',
        type: 'UUID',
      },
    ],
  })
  async findAll(@Query() findUsersDto: FindUsersDto) {
    return await this.findAllUsersUseCase.execute(findUsersDto)
  }

  @Get(':id')
  @ApiFindOne(UserResponseDto)
  async findOne(@Param() { id }: UuidParamDto) {
    return await this.findUserByIdUseCase.execute(id)
  }

  @Patch(':id')
  @ApiUpdate(UserResponseDto, {
    description:
      'Actualiza los datos de un usuario y retorna la entidad actualizada. NO actualiza la contraseña (usar endpoint de autenticación).',
    conflictMessage: 'Ya existe un usuario con ese email, username o CI',
  })
  async update(
    @Param() { id }: UuidParamDto,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.updateUserUseCase.execute(id, updateUserDto)
  }

  @Post(':id/upload-image')
  @HttpCode(HttpStatus.OK)
  @UploadAvatar({
    maxSize: 2 * 1024 * 1024, // 2MB
  })
  @ApiOperation({
    summary: 'Subir imagen de perfil del usuario',
    description:
      'Sube o reemplaza la imagen de perfil y retorna el usuario actualizado. Formatos: JPG, PNG, WebP. Tamaño máximo: 2MB. Dimensiones: 512x512px.',
  })
  @ApiOkResponse(UserResponseDto, 'Imagen subida exitosamente')
  @ApiNotFoundResponse('Usuario no encontrado')
  @ApiStandardResponses()
  async uploadProfileImage(
    @Param() { id }: UuidParamDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Debe proporcionar un archivo de imagen')
    }
    return await this.uploadProfileImageUseCase.execute(id, file)
  }

  @Delete(':id/image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar imagen de perfil del usuario',
    description:
      'Elimina la imagen de perfil del usuario, la remueve del storage y retorna el usuario actualizado.',
  })
  @ApiOkResponse(UserResponseDto, 'Imagen eliminada exitosamente')
  @ApiNotFoundResponse('Usuario no encontrado')
  @ApiStandardResponses()
  async deleteProfileImage(@Param() { id }: UuidParamDto) {
    return await this.deleteProfileImageUseCase.execute(id)
  }

  @Patch(':id/deactivate')
  @ApiCustom(UserResponseDto, {
    summary: 'Desactivar un usuario',
    description:
      'Cambia el estado del usuario a SUSPENDED y retorna el usuario actualizado.',
  })
  async deactivate(@Param() { id }: UuidParamDto) {
    return await this.deactivateUserUseCase.execute(id)
  }

  @Patch(':id/activate')
  @ApiCustom(UserResponseDto, {
    summary: 'Activar un usuario',
    description:
      'Cambia el estado del usuario a ACTIVE y retorna el usuario actualizado.',
  })
  async activate(@Param() { id }: UuidParamDto) {
    return await this.activateUserUseCase.execute(id)
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar email y establecer contraseña inicial',
    description:
      'Verifica el email del usuario usando el token enviado por correo y establece su contraseña inicial. Marca el email como verificado y activa la cuenta.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Email verificado exitosamente, contraseña establecida y cuenta activada',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Token inválido/expirado o contraseña no cumple requisitos de seguridad',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return await this.verifyEmailUseCase.execute(dto)
  }

  @Post(':id/resend-invitation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Re-enviar invitación de verificación',
    description:
      'Re-envía el email de invitación con un nuevo token de verificación. Solo disponible para usuarios con email no verificado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitación enviada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'El email ya fue verificado',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async resendInvitation(@Param() { id }: UuidParamDto) {
    return await this.resendInvitationUseCase.execute(id)
  }

  @Delete(':id')
  @ApiRemove(UserResponseDto, {
    summary: 'Eliminar un usuario (soft delete)',
    description:
      'Marca el usuario como eliminado sin borrar sus datos de la base de datos. Retorna el usuario eliminado para confirmación.',
  })
  async remove(@Param() { id }: UuidParamDto) {
    return await this.removeUserUseCase.execute(id)
  }
}

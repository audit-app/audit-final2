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
  ApiCreateResponses,
  ApiReadResponses,
  ApiUpdateResponses,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiStandardResponses,
  ApiDeleteResponses,
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
} from '../use-cases'
import { CreateUserDto, UpdateUserDto } from '../dtos'
import { UserEntity } from '../entities/user.entity'
import { UploadAvatar } from '@core/files'
import { Public } from '../../auth'
import { FindUsersDto } from '../dtos/find-users.dto'
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
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo usuario',
    description:
      'Crea un nuevo usuario con sus datos básicos. La contraseña se hashea automáticamente con bcrypt.',
  })
  @ApiCreateResponses(
    UserEntity,
    'Ya existe un usuario con ese email, username o CI',
  )
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.createUserUseCase.execute(createUserDto)
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los usuarios',
    description: `
Obtiene una lista paginada de usuarios con capacidades de búsqueda y filtrado.

**Parámetros de paginación:**
- \`page\`: Número de página (default: 1)
- \`limit\`: Cantidad de resultados por página (default: 10)
- \`sortBy\`: Campo por el cual ordenar (default: createdAt)
- \`sortOrder\`: Orden ascendente (ASC) o descendente (DESC) (default: DESC)

**Parámetros de filtrado:**
- \`search\`: Búsqueda de texto libre en names, lastNames, email, username, ci
- \`status\`: Filtrar por estado (active, inactive, suspended)
- \`role\`: Filtrar por rol (admin, gerente, auditor, cliente)
- \`organizationId\`: Filtrar por ID de organización

**Campos ordenables:** lastNames, email, createdAt, organizationId, status, ci, phone, names
    `.trim(),
  })
  @ApiReadResponses(UserResponseDto, true)
  async findAll(@Query() findUsersDto: FindUsersDto) {
    return await this.findAllUsersUseCase.execute(findUsersDto)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un usuario por ID',
    description:
      'Retorna los datos completos de un usuario específico mediante su ID único.',
  })
  @ApiOkResponse(UserResponseDto, 'Usuario encontrado exitosamente')
  @ApiNotFoundResponse('Usuario no encontrado')
  @ApiStandardResponses()
  async findOne(@Param() { id }: UuidParamDto) {
    return await this.findUserByIdUseCase.execute(id)
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un usuario',
    description:
      'Actualiza los datos de un usuario y retorna la entidad actualizada. NO actualiza la contraseña (usar endpoint de autenticación).',
  })
  @ApiUpdateResponses(UserResponseDto, true)
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desactivar un usuario',
    description:
      'Cambia el estado del usuario a INACTIVE y retorna el usuario actualizado.',
  })
  @ApiUpdateResponses(UserResponseDto)
  async deactivate(@Param() { id }: UuidParamDto) {
    return await this.deactivateUserUseCase.execute(id)
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activar un usuario',
    description:
      'Cambia el estado del usuario a ACTIVE y retorna el usuario actualizado.',
  })
  @ApiUpdateResponses(UserResponseDto)
  async activate(@Param() { id }: UuidParamDto) {
    return await this.activateUserUseCase.execute(id)
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar email de usuario',
    description:
      'Verifica el email del usuario usando el token enviado por correo. Marca el email como verificado y activa la cuenta.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verificado exitosamente y cuenta activada',
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido o expirado',
  })
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token de verificación requerido')
    }
    return await this.verifyEmailUseCase.execute(token)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un usuario (soft delete)',
    description:
      'Marca el usuario como eliminado sin borrar sus datos de la base de datos. No retorna contenido.',
  })
  @ApiDeleteResponses(true)
  async remove(@Param() { id }: UuidParamDto) {
    await this.removeUserUseCase.execute(id)
  }
}

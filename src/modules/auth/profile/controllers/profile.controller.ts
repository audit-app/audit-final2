import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ApiStandardResponses, ApiOkResponse } from '@core/swagger'
import { ResponseMessage } from '@core/http'
import { UploadAvatar } from '@core/files'
import { GetUser } from '../../core/decorators/get-user.decorator'
import { UserResponseDto } from '../../../users/dtos/user-response.dto'
import {
  UploadProfileAvatarUseCase,
  DeleteProfileAvatarUseCase,
  ChangePasswordUseCase,
  ChangePasswordDto,
  ActivateTwoFactorUseCase,
  DeactivateTwoFactorUseCase,
} from '../use-cases'

/**
 * Profile Controller
 *
 * Endpoints para que el usuario autenticado gestione SU PROPIO perfil:
 * - Subir/eliminar avatar
 * - Cambiar contraseña
 * - Activar/desactivar 2FA
 *
 * Diferencia con UsersController:
 * - NO requiere permisos de ADMIN
 * - NO recibe :id en parámetros (usa token JWT)
 * - Usuario solo gestiona SU PROPIO perfil
 *
 * Endpoints: /auth/profile/*
 */
@ApiTags('auth-profile')
@Controller('auth/profile')
export class ProfileController {
  constructor(
    private readonly uploadProfileAvatarUseCase: UploadProfileAvatarUseCase,
    private readonly deleteProfileAvatarUseCase: DeleteProfileAvatarUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly activateTwoFactorUseCase: ActivateTwoFactorUseCase,
    private readonly deactivateTwoFactorUseCase: DeactivateTwoFactorUseCase,
  ) {}

  // ========================================
  // AVATAR
  // ========================================

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UploadAvatar({
    maxSize: 2 * 1024 * 1024, // 2MB
  })
  @ApiOperation({
    summary: 'Subir imagen de perfil (self-service)',
    description:
      'Usuario autenticado sube o reemplaza SU imagen de perfil. Formatos: JPG, PNG, WebP. Tamaño máximo: 2MB. Dimensiones: 800x800px.',
  })
  @ApiOkResponse(UserResponseDto, 'Imagen subida exitosamente')
  @ApiStandardResponses()
  async uploadAvatar(
    @GetUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Debe proporcionar un archivo de imagen')
    }
    return await this.uploadProfileAvatarUseCase.execute(userId, file)
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar imagen de perfil (self-service)',
    description:
      'Usuario autenticado elimina SU imagen de perfil del storage y retorna el usuario actualizado.',
  })
  @ApiOkResponse(UserResponseDto, 'Imagen eliminada exitosamente')
  @ApiStandardResponses()
  async deleteAvatar(@GetUser('sub') userId: string) {
    return await this.deleteProfileAvatarUseCase.execute(userId)
  }

  // ========================================
  // PASSWORD
  // ========================================

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Contraseña actualizada exitosamente')
  @ApiOperation({
    summary: 'Cambiar contraseña (self-service)',
    description:
      'Usuario autenticado cambia SU contraseña. Requiere contraseña actual para validación. ' +
      'Revoca todas las sesiones activas y dispositivos confiables por seguridad.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Contraseña actualizada. Sesiones cerradas. Usuario debe volver a iniciar sesión.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Contraseña actualizada exitosamente. Se han cerrado todas las sesiones por seguridad. Deberás volver a iniciar sesión.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Contraseña actual incorrecta o nueva contraseña inválida',
  })
  @ApiStandardResponses()
  async changePassword(
    @GetUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return await this.changePasswordUseCase.execute(userId, dto)
  }

  // ========================================
  // TWO-FACTOR AUTHENTICATION (2FA)
  // ========================================

  @Patch('2fa/activate')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('2FA activado exitosamente')
  @ApiOperation({
    summary: 'Activar 2FA (self-service)',
    description:
      'Usuario autenticado activa la autenticación de dos factores en SU cuenta. ' +
      'A partir de ahora, deberá ingresar un código enviado por email al iniciar sesión.',
  })
  @ApiOkResponse(UserResponseDto, '2FA activado exitosamente')
  @ApiStandardResponses()
  async activate2fa(@GetUser('sub') userId: string) {
    return await this.activateTwoFactorUseCase.execute(userId)
  }

  @Patch('2fa/deactivate')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('2FA desactivado exitosamente')
  @ApiOperation({
    summary: 'Desactivar 2FA (self-service)',
    description:
      'Usuario autenticado desactiva la autenticación de dos factores en SU cuenta. ' +
      'Ya no se requerirá código de verificación al iniciar sesión.',
  })
  @ApiOkResponse(UserResponseDto, '2FA desactivado exitosamente')
  @ApiStandardResponses()
  async deactivate2fa(@GetUser('sub') userId: string) {
    return await this.deactivateTwoFactorUseCase.execute(userId)
  }
}

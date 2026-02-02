import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ApiStandardResponses } from '@core/swagger'
import { UuidParamDto } from '@core/dtos'
import {
  ChangeUserEmailUseCase,
  ChangeUserEmailDto,
} from '../use-cases/change-user-email'

/**
 * User Identity Administration Controller
 *
 * Endpoints administrativos para operaciones críticas de identidad:
 * - Cambio de email (genera nueva password, revoca sesiones)
 *
 * IMPORTANTE: Todos estos endpoints son ADMIN-ONLY
 */
@ApiTags('auth-administration')
@Controller('auth/admin')
export class UserIdentityController {
  constructor(
    private readonly changeUserEmailUseCase: ChangeUserEmailUseCase,
  ) {}

  @Post('users/:id/change-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambiar email de usuario (SOLO ADMIN)',
    description:
      'Cambia el email del usuario y genera una nueva contraseña temporal. ' +
      'Revoca todas las sesiones activas y envía un welcome email con las nuevas credenciales al nuevo email. ' +
      'CRÍTICO: Solo para administradores. El usuario debe hacer login con la nueva contraseña temporal.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Email cambiado exitosamente. Se envió welcome email con credenciales',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Email cambiado exitosamente. Se envió un email de bienvenida con las nuevas credenciales a nuevo@email.com.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El nuevo email ya está en uso',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @ApiStandardResponses()
  async changeEmail(
    @Param() { id }: UuidParamDto,
    @Body() dto: ChangeUserEmailDto,
  ) {
    return await this.changeUserEmailUseCase.execute(id, dto)
  }
}

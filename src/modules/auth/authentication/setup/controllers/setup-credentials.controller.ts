import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { ResponseMessage } from '@core/http'
import { MessageResponseDto } from '@core/dtos'
import { ApiWrappedResponse } from '@core/swagger'
import { Public } from '../../../core/decorators'
import { SetupPasswordUseCase } from '../use-cases/setup-password.use-case'
import { SetupPasswordDto } from '../dtos/setup-password.dto'

/**
 * Controlador para establecer credenciales iniciales
 *
 * Permite a los usuarios configurar su método de inicio de sesión
 * después de verificar su email
 */
@ApiTags('Auth - Setup')
@Controller('auth/setup')
export class SetupCredentialsController {
  constructor(private readonly setupPasswordUseCase: SetupPasswordUseCase) {}

  /**
   * POST /auth/setup/password
   *
   * Establece la contraseña inicial del usuario usando el token temporal
   * obtenido al verificar el email
   *
   * @param dto - Token de setup y contraseña nueva
   * @returns Mensaje de confirmación
   *
   * @example
   * ```json
   * POST /auth/setup/password
   * {
   *   "setupToken": "550e8400-e29b-41d4-a716-446655440000",
   *   "password": "MySecurePass123!"
   * }
   * ```
   */
  @Public()
  @Post('password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Contraseña establecida exitosamente')
  @ApiOperation({
    summary: 'Establecer contraseña inicial después de verificar email',
    description:
      'Permite al usuario establecer su contraseña usando el token temporal de setup (15 minutos de vigencia)',
  })
  @ApiWrappedResponse({
    status: HttpStatus.OK,
    description: 'Contraseña establecida exitosamente',
    type: MessageResponseDto,
  })
  @ApiWrappedResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Token inválido, expirado o email no verificado',
  })
  async setupPassword(
    @Body() dto: SetupPasswordDto,
  ): Promise<MessageResponseDto> {
    return this.setupPasswordUseCase.execute(dto)
  }
}

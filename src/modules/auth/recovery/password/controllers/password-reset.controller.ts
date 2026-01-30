import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ResponseMessage } from '@core/http'
import { MessageResponseDto } from '@core/dtos'
import { ApiWrappedResponse } from '@core/swagger'
import {
  RequestResetPasswordDto,
  RequestResetResponseDto,
  ResetPasswordDto,
} from '../dtos'
import { Public } from '../../../core/decorators'
import { RequestResetPasswordUseCase, ResetPasswordUseCase } from '../use-cases'

/**
 * PasswordResetController
 *
 * Maneja endpoints relacionados con recuperación de contraseña:
 * - Solicitar token de reset (envía email)
 * - Resetear contraseña con token válido
 */
@ApiTags('Password Reset')
@Controller('auth/password')
export class PasswordResetController {
  constructor(
    private readonly requestResetUseCase: RequestResetPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  /**
   * POST /auth/password/request-reset
   *
   * Solicita un reset de contraseña con doble validación
   * Genera tokenId (devuelve al frontend) + OTP (envía por correo)
   *
   * @param dto - Email del usuario
   * @param ip - IP del cliente (rate limiting)
   * @returns { message, tokenId } - tokenId para frontend, OTP va por correo
   *
   * @example
   * ```json
   * POST /auth/password/request-reset
   * {
   *   "email": "usuario@example.com"
   * }
   * ```
   */
  @Public()
  @Post('request-reset')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Solicitud de reset procesada')
  @ApiOperation({
    summary: 'Solicitar reset de contraseña con doble validación',
  })
  @ApiWrappedResponse({
    status: HttpStatus.OK,
    description: 'Email enviado con código OTP (si el usuario existe)',
    type: RequestResetResponseDto,
  })
  @ApiWrappedResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Demasiados intentos desde esta cuenta',
  })
  async requestReset(
    @Body() dto: RequestResetPasswordDto,
  ): Promise<RequestResetResponseDto> {
    return await this.requestResetUseCase.execute(dto.email)
  }

  /**
   * POST /auth/password/reset
   *
   * Resetea la contraseña usando doble validación (tokenId + OTP)
   * Revoca el token y cierra todas las sesiones del usuario
   *
   * @param dto - tokenId (del frontend) + otpCode (del correo) + nueva contraseña
   * @returns Mensaje de confirmación
   *
   * @example
   * ```json
   * POST /auth/password/reset
   * {
   *   "tokenId": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
   *   "otpCode": "123456",
   *   "newPassword": "NewSecurePass123!"
   * }
   * ```
   */
  @Public()
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Contraseña actualizada exitosamente')
  @ApiOperation({
    summary: 'Resetear contraseña con doble validación (tokenId + OTP)',
  })
  @ApiWrappedResponse({
    status: HttpStatus.OK,
    description: 'Contraseña actualizada exitosamente',
    type: MessageResponseDto,
  })
  @ApiWrappedResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Token o código OTP inválido o expirado',
  })
  @ApiWrappedResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuario no encontrado',
  })
  async reset(@Body() dto: ResetPasswordDto): Promise<MessageResponseDto> {
    return await this.resetPasswordUseCase.execute(
      dto.tokenId,
      dto.otpCode,
      dto.newPassword,
    )
  }
}

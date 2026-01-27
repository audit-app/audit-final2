import { Controller, Post, Body, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { ResponseMessage } from '@core/decorators'
import { MessageResponseDto } from '@core/dtos'
import { ApiWrappedResponse } from '@core/swagger'
import { Public } from '../../../core/decorators/public.decorator'
import { RequestEmailVerificationUseCase } from '../use-cases/request-email-verification.use-case'
import { VerifyEmailUseCase } from '../use-cases/verify-email.use-case'
import { RequestEmailVerificationDto, VerifyEmailDto } from '../dtos'

/**
 * Controller para verificación de email
 *
 * Endpoints:
 * - POST /auth/email-verification/request - Solicitar verificación de email
 * - POST /auth/email-verification/verify - Verificar email con token
 *
 * Ambos endpoints son públicos (no requieren autenticación)
 */
@ApiTags('Email Verification')
@Controller('auth/email-verification')
export class EmailVerificationController {
  constructor(
    private readonly requestEmailVerificationUseCase: RequestEmailVerificationUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
  ) {}

  /**
   * Solicita el envío de un enlace de verificación de email
   *
   * Endpoint público (no requiere autenticación)
   * Protegido por Throttler global
   *
   * Caso de uso:
   * - Usuario no recibió el email de verificación al registrarse
   * - Usuario quiere verificar su email después
   *
   * @param dto - Email del usuario
   * @returns Mensaje de confirmación (siempre genérico)
   */
  @Public()
  @Post('request')
  @ResponseMessage('Solicitud de verificación procesada')
  @ApiOperation({
    summary: 'Solicitar verificación de email',
    description:
      'Envía un enlace de verificación al email del usuario. Retorna una respuesta genérica para evitar enumeración de usuarios.',
  })
  @ApiWrappedResponse({
    status: HttpStatus.OK,
    description: 'Solicitud procesada (respuesta genérica)',
    type: MessageResponseDto,
  })
  async requestVerification(
    @Body() dto: RequestEmailVerificationDto,
  ): Promise<MessageResponseDto> {
    return await this.requestEmailVerificationUseCase.execute(dto.email)
  }

  /**
   * Verifica el email del usuario con un token JWT
   *
   * Endpoint público (no requiere autenticación)
   * Protegido por Throttler global
   *
   * Caso de uso:
   * - Usuario hace clic en el enlace recibido por email
   * - Frontend extrae el token y lo envía a este endpoint
   *
   * Validaciones:
   * - Token JWT válido (firma + expiración)
   * - Token no usado previamente (one-time use)
   * - Usuario existe
   * - Email no verificado previamente
   *
   * @param dto - Token JWT de verificación
   * @returns Mensaje de confirmación
   */
  @Public()
  @Post('verify')
  @ResponseMessage('Email verificado exitosamente')
  @ApiOperation({
    summary: 'Verificar email con token',
    description:
      'Verifica el email del usuario usando el token JWT recibido por correo. El token es de un solo uso y válido por 7 días.',
  })
  @ApiWrappedResponse({
    status: HttpStatus.OK,
    description: 'Email verificado exitosamente',
    type: MessageResponseDto,
  })
  @ApiWrappedResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Token inválido, expirado o ya usado',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<MessageResponseDto> {
    return await this.verifyEmailUseCase.execute(dto.token)
  }
}

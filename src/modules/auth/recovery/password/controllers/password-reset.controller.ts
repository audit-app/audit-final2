import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger'
import { Public, ResponseMessage } from '@core/http'
import { MessageResponseDto } from '@core/dtos'
import { ApiWrappedResponse, ApiStandardResponses } from '@core/swagger'
import {
  RequestResetPasswordDto,
  RequestResetResponseDto,
  ResendResetPasswordDto,
  ResetPasswordDto,
} from '../dtos'
import {
  RequestResetPasswordUseCase,
  ResendResetPasswordUseCase,
  ResetPasswordUseCase,
} from '../use-cases'

@ApiTags('Password Reset')
@Controller('auth/password')
export class PasswordResetController {
  constructor(
    private readonly requestResetUseCase: RequestResetPasswordUseCase,
    private readonly resendResetUseCase: ResendResetPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Public()
  @Post('request-reset')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Solicitud de reset procesada')
  @ApiOperation({
    summary: 'Solicitar reset de contraseña',
    description:
      'Inicia el proceso de recuperación de contraseña. Envía un código OTP de 6 dígitos ' +
      'por email y retorna un tokenId que debe usarse junto con el OTP para resetear la contraseña. ' +
      'Por seguridad, siempre responde con éxito aunque el email no exista.',
  })
  @ApiWrappedResponse({
    status: HttpStatus.OK,
    description:
      'Solicitud procesada. Si el email existe, se envió el código OTP. El tokenId debe guardarse para el siguiente paso.',
    type: RequestResetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description:
      'Demasiados intentos. Máximo 10 solicitudes por email en 60 minutos. ' +
      'Espera antes de intentar nuevamente.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 429 },
        message: {
          type: 'string',
          example:
            'Has excedido el límite de solicitudes. Inténtalo de nuevo en 45 minutos.',
        },
        error: { type: 'string', example: 'Too Many Attempts' },
        timestamp: { type: 'string', example: '2026-02-03T10:30:00.000Z' },
      },
    },
  })
  @ApiStandardResponses({ exclude: [401, 403, 404] })
  async requestReset(
    @Body() dto: RequestResetPasswordDto,
  ): Promise<RequestResetResponseDto> {
    return await this.requestResetUseCase.execute(dto.email)
  }

  /**
   * POST /auth/password/resend-reset
   *
   * Reenvía el mismo código OTP al email del usuario.
   * No genera un nuevo tokenId ni un nuevo código, solo reenvía el código existente.
   *
   * Flujo:
   * 1. Verifica que el tokenId existe en Redis
   * 2. Obtiene el código OTP almacenado
   * 3. Verifica cooldown (60 segundos entre resends)
   * 4. Reenvía el MISMO código por email
   * 5. Marca el intento de resend (inicia cooldown)
   *
   * Rate Limiting:
   * - Cooldown de 60 segundos entre resends
   * - Si el token expiró (1 hora), debe solicitar un nuevo reset
   *
   * Uso típico:
   * - Usuario no recibió el email
   * - Usuario eliminó el email por error
   * - Código no llegó por problemas de servidor SMTP
   */
  @Public()
  @Post('resend-reset')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Código reenviado exitosamente')
  @ApiOperation({
    summary: 'Reenviar código de reset password',
    description:
      'Reenvía el mismo código OTP de 6 dígitos al email del usuario. ' +
      'No genera un nuevo tokenId ni un nuevo código, solo reenvía el código existente ' +
      'que aún no ha expirado. Requiere esperar 60 segundos entre resends.',
  })
  @ApiWrappedResponse({
    status: HttpStatus.OK,
    description:
      'Código OTP reenviado exitosamente. Revisa tu email. ' +
      'Debes esperar 60 segundos antes de solicitar otro resend.',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Token inválido, sesión expirada o token no encontrado. ' +
      'Si el token expiró (1 hora), debes solicitar un nuevo reset.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example:
            'Sesión de reset password no encontrada o expirada. Por favor, solicita un nuevo código.',
        },
        error: { type: 'string', example: 'Bad Request' },
        timestamp: { type: 'string', example: '2026-02-03T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuario no encontrado en la base de datos.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Usuario no encontrado' },
        error: { type: 'string', example: 'Not Found' },
        timestamp: { type: 'string', example: '2026-02-03T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Cooldown activo. Debes esperar 60 segundos entre resends.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 429 },
        message: {
          type: 'string',
          example:
            'Debes esperar 45 segundos antes de solicitar un nuevo código.',
        },
        error: { type: 'string', example: 'Too Many Attempts' },
        timestamp: { type: 'string', example: '2026-02-03T10:30:00.000Z' },
      },
    },
  })
  @ApiStandardResponses({ exclude: [401, 403] })
  async resendReset(
    @Body() dto: ResendResetPasswordDto,
  ): Promise<MessageResponseDto> {
    return await this.resendResetUseCase.execute(dto.tokenId)
  }

  @Public()
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Contraseña actualizada exitosamente')
  @ApiOperation({
    summary: 'Resetear contraseña con doble validación',
    description:
      'Completa el proceso de recuperación de contraseña usando el tokenId recibido ' +
      'anteriormente y el código OTP de 6 dígitos enviado por email. ' +
      'Después del reset exitoso, todas las sesiones activas del usuario se cierran ' +
      'y los dispositivos confiables se eliminan por seguridad.',
  })
  @ApiWrappedResponse({
    status: HttpStatus.OK,
    description:
      'Contraseña actualizada exitosamente. Todas las sesiones fueron revocadas. ' +
      'El usuario debe iniciar sesión nuevamente.',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Token inválido, OTP incorrecto, token expirado o token ya usado. ' +
      'El token se quema automáticamente después de 3 intentos fallidos.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example:
            'Código OTP inválido. Te quedan 2 intentos antes de que el token se revoque.',
        },
        error: { type: 'string', example: 'Bad Request' },
        timestamp: { type: 'string', example: '2026-02-03T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Usuario no encontrado. Esto puede ocurrir si el usuario fue eliminado ' +
      'después de solicitar el reset.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Usuario no encontrado' },
        error: { type: 'string', example: 'Not Found' },
        timestamp: { type: 'string', example: '2026-02-03T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description:
      'Demasiados intentos de validación. El token fue revocado por seguridad.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 429 },
        message: {
          type: 'string',
          example:
            'Has excedido el número de intentos permitidos. El token ha sido revocado. Solicita un nuevo código.',
        },
        error: { type: 'string', example: 'Too Many Attempts' },
        timestamp: { type: 'string', example: '2026-02-03T10:30:00.000Z' },
      },
    },
  })
  @ApiStandardResponses({ exclude: [401, 403] })
  async reset(@Body() dto: ResetPasswordDto): Promise<MessageResponseDto> {
    return await this.resetPasswordUseCase.execute(
      dto.tokenId,
      dto.otpCode,
      dto.newPassword,
    )
  }
}

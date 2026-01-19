import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ConnectionInfo, type ConnectionMetadata } from '@core/common'
import { Generate2FACodeDto, Verify2FACodeDto, Resend2FACodeDto } from '../dtos'
import { Public } from '../../shared/decorators'
import {
  Generate2FACodeUseCase,
  Verify2FACodeUseCase,
  Resend2FACodeUseCase,
} from '../use-cases/two-factor'

/**
 * TwoFactorController
 *
 * Maneja endpoints relacionados con autenticación de dos factores (2FA):
 * - Generar código 2FA (envía email)
 * - Verificar código 2FA
 * - Reenviar código 2FA
 */
@ApiTags('Two-Factor Authentication')
@Controller('auth/2fa')
export class TwoFactorController {
  constructor(
    private readonly generateUseCase: Generate2FACodeUseCase,
    private readonly verifyUseCase: Verify2FACodeUseCase,
    private readonly resendUseCase: Resend2FACodeUseCase,
  ) {}

  /**
   * POST /auth/2fa/verify
   *
   * Verifica un código 2FA
   * El código se elimina de Redis después del primer uso
   *
   * @param dto - userId, código y token
   * @param connection - Metadata de conexión (IP, User-Agent)
   * @returns Resultado de la validación
   *
   * @example
   * ```json
   * POST /auth/2fa/verify
   * {
   *   "userId": "550e8400-e29b-41d4-a716-446655440000",
   *   "code": "123456",
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   * ```
   */
  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código 2FA' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado de la verificación',
    schema: {
      properties: {
        valid: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'Código verificado exitosamente',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Demasiados intentos fallidos',
  })
  async verify(
    @Body() dto: Verify2FACodeDto,
    @ConnectionInfo() connection: ConnectionMetadata,
  ): Promise<{
    valid: boolean
    message: string
    accessToken?: string
    refreshToken?: string
  }> {
    return await this.verifyUseCase.execute(dto, connection)
  }

  /**
   * POST /auth/2fa/resend
   *
   * Reenvía el MISMO código 2FA existente
   * NO genera un nuevo código, reenvía el que ya existe en Redis
   *
   * @param dto - DTO con tokenId (64 caracteres)
   * @returns Mensaje de confirmación (el tokenId NO cambia)
   *
   * @example
   * ```json
   * POST /auth/2fa/resend
   * {
   *   "tokenId": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd"
   * }
   * ```
   */
  @Public()
  @Post('resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reenviar código 2FA existente',
    description:
      'Reenvía el MISMO código 2FA por email. NO genera un nuevo código ni tokenId. ' +
      'El usuario debe usar el mismo tokenId que recibió originalmente.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Código 2FA reenviado (mismo código)',
    schema: {
      properties: {
        message: {
          type: 'string',
          example:
            'Código 2FA reenviado. Espera 60 segundos antes de solicitar otro.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'TokenId inválido o expirado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuario no encontrado o sesión 2FA expirada',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Debe esperar 60 segundos antes de reenviar',
  })
  async resend(@Body() dto: Resend2FACodeDto): Promise<{ message: string }> {
    return await this.resendUseCase.execute(dto.tokenId)
  }
}

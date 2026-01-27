import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ResponseMessage } from '@core/decorators'
import { MessageResponseDto } from '@core/dtos'
import { ApiWrappedResponse } from '@core/swagger'
import type { Response } from 'express'
import { ConnectionInfo, type ConnectionMetadata } from '@core/common'
import { CookieService } from '@core/http/services/cookie.service'
import {
  Verify2FACodeDto,
  Verify2FAResponseDto,
  Resend2FACodeDto,
} from '../dtos'
import { Public } from '../../../core/decorators'
import {
  Verify2FACodeUseCase,
  Resend2FACodeUseCase,
} from '../use-cases'

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
    private readonly verifyUseCase: Verify2FACodeUseCase,
    private readonly resendUseCase: Resend2FACodeUseCase,
    private readonly cookieService: CookieService,
  ) {}

  /**
   * POST /auth/2fa/verify
   *
   * Verifica un código 2FA
   *
   * CAMBIO IMPORTANTE:
   * - Ya NO requiere userId en el body (más seguro)
   * - El userId se extrae automáticamente del token almacenado en Redis
   * - El código se elimina de Redis después del primer uso exitoso
   * - Devuelve DOS cookies HTTP-only: refreshToken y trustedDevice (si trustDevice=true)
   *
   * @param dto - Token (64 chars), código (6 dígitos) y trustDevice (opcional)
   * @param connection - Metadata de conexión (IP, User-Agent)
   * @param res - Express response para setear cookies
   * @returns Resultado de la validación con accessToken en el body
   *
   * @example
   * ```json
   * POST /auth/2fa/verify
   * {
   *   "token": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd",
   *   "code": "123456",
   *   "trustDevice": true
   * }
   *
   * Response Body:
   * {
   *   "valid": true,
   *   "message": "Código verificado exitosamente",
   *   "accessToken": "jwt-here"
   * }
   *
   * Response Cookies:
   * Set-Cookie: refreshToken=jwt-here; HttpOnly; Secure; SameSite=Strict
   * Set-Cookie: trustedDevice=uuid-here; HttpOnly; Secure; SameSite=Strict; Max-Age=7776000
   * ```
   */
  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Código 2FA verificado exitosamente')
  @ApiOperation({ summary: 'Verificar código 2FA' })
  @ApiWrappedResponse({
    status: HttpStatus.OK,
    description:
      'Verificación exitosa. Retorna accessToken en body, refreshToken y trustedDevice en cookies.',
    type: Verify2FAResponseDto,
  })
  @ApiWrappedResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Código inválido o token expirado',
  })
  @ApiWrappedResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Demasiados intentos fallidos',
  })
  async verify(
    @Body() dto: Verify2FACodeDto,
    @ConnectionInfo() connection: ConnectionMetadata,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Verify2FAResponseDto> {
    const result = await this.verifyUseCase.execute(dto, connection)

    // 1. Setear cookie de refreshToken (SIEMPRE)
    this.cookieService.setRefreshToken(
      res,
      result.refreshToken,
      result.rememberMe,
    )

    // 2. Si el usuario marcó trustDevice=true, setear cookie con el deviceId
    if (result.deviceId) {
      this.cookieService.setTrustedDeviceToken(res, result.deviceId)
    }

    // 3. Solo devolver accessToken en el body (refreshToken y deviceId están en cookies)
    return {
      valid: result.valid,
      message: result.message,
      accessToken: result.accessToken,
    }
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
  @ResponseMessage('Código 2FA reenviado exitosamente')
  @ApiOperation({
    summary: 'Reenviar código 2FA existente',
    description:
      'Reenvía el MISMO código 2FA por email. NO genera un nuevo código ni tokenId. ' +
      'El usuario debe usar el mismo tokenId que recibió originalmente.',
  })
  @ApiWrappedResponse({
    status: HttpStatus.OK,
    description: 'Código 2FA reenviado (mismo código)',
    type: MessageResponseDto,
  })
  @ApiWrappedResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'TokenId inválido o expirado',
  })
  @ApiWrappedResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuario no encontrado o sesión 2FA expirada',
  })
  @ApiWrappedResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Debe esperar 60 segundos antes de reenviar',
  })
  async resend(@Body() dto: Resend2FACodeDto): Promise<MessageResponseDto> {
    return await this.resendUseCase.execute(dto.token)
  }
}

import {
  Controller,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { ResponseMessage } from '@core/decorators'
import type { Request } from 'express'
import {
  ListTrustedDevicesUseCase,
  RevokeTrustedDeviceUseCase,
  RevokeAllTrustedDevicesUseCase,
} from '../use-cases'
import { TrustedDeviceResponseDto, RevokeDeviceDto } from '../dtos'

/**
 * TrustedDevicesController
 *
 * Maneja la gestión de dispositivos confiables (2FA bypass) del usuario.
 *
 * Los dispositivos confiables son aquellos donde el usuario ha activado
 * "Remember this device" para no solicitar 2FA en futuros logins.
 *
 * Endpoints:
 * - GET /auth/trusted-devices - Listar dispositivos confiables
 * - DELETE /auth/trusted-devices - Revocar un dispositivo específico
 * - DELETE /auth/trusted-devices/all - Revocar todos los dispositivos
 */
@ApiTags('Trusted Devices')
@Controller('auth/trusted-devices')
@ApiBearerAuth() // Requiere autenticación
export class TrustedDevicesController {
  constructor(
    private readonly listTrustedDevicesUseCase: ListTrustedDevicesUseCase,
    private readonly revokeTrustedDeviceUseCase: RevokeTrustedDeviceUseCase,
    private readonly revokeAllTrustedDevicesUseCase: RevokeAllTrustedDevicesUseCase,
  ) {}

  /**
   * GET /auth/trusted-devices
   *
   * Lista todos los dispositivos confiables del usuario autenticado.
   * Muestra qué dispositivos tienen habilitado "Remember this device".
   *
   * @param req - Request con usuario autenticado
   * @returns Lista de dispositivos confiables
   *
   * @example
   * ```json
   * GET /auth/trusted-devices
   * Authorization: Bearer {access_token}
   * ```
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Dispositivos confiables obtenidos exitosamente')
  @ApiOperation({ summary: 'Listar dispositivos confiables del usuario' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de dispositivos confiables',
    type: [TrustedDeviceResponseDto],
  })
  async listDevices(@Req() req: Request): Promise<TrustedDeviceResponseDto[]> {
    const userId = req.user.sub

    return await this.listTrustedDevicesUseCase.execute(userId)
  }

  /**
   * DELETE /auth/trusted-devices
   *
   * Revoca un dispositivo confiable específico.
   * El dispositivo deberá completar 2FA en el próximo login.
   *
   * @param req - Request con usuario autenticado
   * @param dto - DTO con el fingerprint del dispositivo a revocar
   * @returns Mensaje de confirmación
   *
   * @example
   * ```json
   * DELETE /auth/trusted-devices
   * Authorization: Bearer {access_token}
   * {
   *   "fingerprint": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
   * }
   * ```
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar un dispositivo confiable específico' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dispositivo confiable revocado exitosamente',
    schema: {
      properties: {
        message: {
          type: 'string',
          example:
            'Dispositivo confiable revocado exitosamente. Se solicitará 2FA en el próximo login desde este dispositivo.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dispositivo no encontrado o ya fue revocado',
  })
  async revokeDevice(
    @Req() req: Request,
    @Body() dto: RevokeDeviceDto,
  ): Promise<{ message: string }> {
    const userId = req.user.sub

    return await this.revokeTrustedDeviceUseCase.execute(userId, dto.fingerprint)
  }

  /**
   * DELETE /auth/trusted-devices/all
   *
   * Revoca TODOS los dispositivos confiables del usuario.
   * Todos los dispositivos deberán completar 2FA en el próximo login.
   *
   * Útil cuando sospechas que tu cuenta fue comprometida.
   *
   * @param req - Request con usuario autenticado
   * @returns Mensaje de confirmación con cantidad de dispositivos revocados
   *
   * @example
   * ```json
   * DELETE /auth/trusted-devices/all
   * Authorization: Bearer {access_token}
   * ```
   */
  @Delete('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar todos los dispositivos confiables' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Todos los dispositivos confiables han sido revocados',
    schema: {
      properties: {
        message: {
          type: 'string',
          example:
            'Todos los dispositivos confiables han sido revocados. Se solicitará 2FA en el próximo login.',
        },
        count: {
          type: 'number',
          example: 3,
        },
      },
    },
  })
  async revokeAllDevices(
    @Req() req: Request,
  ): Promise<{ message: string; count: number }> {
    const userId = req.user.sub

    return await this.revokeAllTrustedDevicesUseCase.execute(userId)
  }
}

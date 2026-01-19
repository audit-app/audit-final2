import {
  Controller,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { ResponseMessage } from '@core/decorators'
import type { Request } from 'express'
import {
  ListSessionsUseCase,
  RevokeSessionUseCase,
  RevokeAllSessionsUseCase,
} from '../use-cases'
import { SessionResponseDto, RevokeSessionDto } from '../dtos'
import { JwtAuthGuard } from '../../shared'

import { TokensService } from '../../login'
import { CookieService } from '@core/http/services/cookie.service'

/**
 * SessionsController
 *
 * Maneja la gestión de sesiones activas (refresh tokens) del usuario.
 *
 * Endpoints:
 * - GET /auth/sessions - Listar sesiones activas
 * - DELETE /auth/sessions/:id - Revocar una sesión específica
 * - DELETE /auth/sessions - Revocar todas las sesiones
 */
@UseGuards(JwtAuthGuard)
@ApiTags('Sessions')
@Controller('auth/sessions')
@ApiBearerAuth()
export class SessionsController {
  constructor(
    private readonly listSessionsUseCase: ListSessionsUseCase,
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
    private readonly revokeAllSessionsUseCase: RevokeAllSessionsUseCase,
    private readonly tokensService: TokensService,
    private readonly cookieService: CookieService,
  ) {}

  /**
   * GET /auth/sessions
   *
   * Lista todas las sesiones activas del usuario autenticado.
   * Identifica cuál es la sesión actual del usuario.
   *
   * @param req - Request con usuario autenticado
   * @returns Lista de sesiones activas
   *
   * @example
   * ```json
   * GET /auth/sessions
   * Authorization: Bearer {access_token}
   * ```
   */

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Sesiones activas obtenidas exitosamente')
  @ApiOperation({ summary: 'Listar sesiones activas del usuario' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de sesiones activas',
    type: [SessionResponseDto],
  })
  async listSessions(@Req() req: Request): Promise<SessionResponseDto[]> {
    const userId = req.user!.sub

    const token = this.cookieService.getRefreshToken(req)

    if (!token) {
      throw new UnauthorizedException('Refresh token no encontrado')
    }
    const payload = this.tokensService.decodeRefreshToken(token)

    return await this.listSessionsUseCase.execute(userId, payload.tokenId)
  }

  /**
   * DELETE /auth/sessions/:id
   *
   * Revoca una sesión específica (cierra sesión en ese dispositivo).
   * Solo el propietario puede revocar sus propias sesiones.
   *
   * @param req - Request con usuario autenticado
   * @param dto - DTO con el sessionId a revocar
   * @returns Mensaje de confirmación
   *
   * @example
   * ```json
   * DELETE /auth/sessions
   * Authorization: Bearer {access_token}
   * {
   *   "sessionId": "a1b2c3d4-e5f6-4321-a1b2-c3d4e5f6a7b8"
   * }
   * ```
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar una sesión específica' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sesión revocada exitosamente',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Sesión revocada exitosamente',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sesión no encontrada o ya fue revocada',
  })
  async revokeSession(
    @Req() req: Request,
    @Body() dto: RevokeSessionDto,
  ): Promise<{ message: string }> {
    const userId = req.user!.sub

    return await this.revokeSessionUseCase.execute(userId, dto.sessionId)
  }

  /**
   * DELETE /auth/sessions/all
   *
   * Revoca TODAS las sesiones del usuario (cierra sesión en todos los dispositivos).
   * Útil cuando sospechas que tu cuenta fue comprometida.
   *
   * NOTA: También cierra la sesión actual, el usuario debe volver a iniciar sesión.
   *
   * @param req - Request con usuario autenticado
   * @returns Mensaje de confirmación con cantidad de sesiones cerradas
   *
   * @example
   * ```json
   * DELETE /auth/sessions/all
   * Authorization: Bearer {access_token}
   * ```
   */
  @Delete('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar todas las sesiones activas' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Todas las sesiones han sido cerradas',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Todas las sesiones han sido cerradas',
        },
        count: {
          type: 'number',
          example: 3,
        },
      },
    },
  })
  async revokeAllSessions(
    @Req() req: Request,
  ): Promise<{ message: string; count: number }> {
    const userId = req.user!.sub

    return await this.revokeAllSessionsUseCase.execute(userId)
  }
}

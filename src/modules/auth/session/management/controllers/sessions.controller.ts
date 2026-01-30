import {
  Controller,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { ResponseMessage } from '@core/http'
import { MessageResponseDto, MessageWithCountResponseDto } from '@core/dtos'
import { ApiWrappedResponse } from '@core/swagger'
import type { Request } from 'express'
import {
  ListSessionsUseCase,
  RevokeSessionUseCase,
  RevokeAllSessionsUseCase,
} from '../use-cases'
import { SessionResponseDto, RevokeSessionDto } from '../dtos'
import { GetUser, JwtAuthGuard } from '../../../core'
import type { JwtPayload } from '../../../core'
import { TokensService } from '../../../core/services'
import { CookieService } from '@core/http'

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

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Sesiones activas obtenidas exitosamente')
  @ApiOperation({ summary: 'Listar sesiones activas del usuario' })
  @ApiWrappedResponse({
    status: HttpStatus.OK,
    description:
      'Lista de sesiones activas. La sesión actual se marca con isCurrent=true si hay refresh token en cookie.',
    type: SessionResponseDto,
    isArray: true,
  })
  async listSessions(
    @Req() req: Request,
    @GetUser() user: JwtPayload,
  ): Promise<SessionResponseDto[]> {
    // Intentar obtener el tokenId actual (opcional)
    let currentTokenId: string | undefined
    try {
      const refreshToken = this.cookieService.getRefreshToken(req)
      if (refreshToken) {
        const payload = this.tokensService.decodeRefreshToken(refreshToken)
        currentTokenId = payload.tokenId
      }
    } catch {
      currentTokenId = undefined
    }

    return await this.listSessionsUseCase.execute(user.sub, currentTokenId)
  }

  /**
   * DELETE /auth/sessions
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
   * Body:
   * {
   *   "sessionId": "a1b2c3d4-e5f6-4321-a1b2-c3d4e5f6a7b8"
   * }
   * ```
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Sesión revocada exitosamente')
  @ApiOperation({ summary: 'Revocar una sesión específica' })
  @ApiWrappedResponse({
    status: HttpStatus.OK,
    description: 'Sesión revocada exitosamente',
    type: MessageResponseDto,
  })
  @ApiWrappedResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sesión no encontrada o ya fue revocada',
  })
  async revokeSession(
    @Req() req: Request,
    @Body() dto: RevokeSessionDto,
    @GetUser() user: JwtPayload,
  ): Promise<MessageResponseDto> {
    return await this.revokeSessionUseCase.execute(user.sub, dto.sessionId)
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
  @ResponseMessage('Todas las sesiones han sido cerradas')
  @ApiOperation({ summary: 'Revocar todas las sesiones activas' })
  @ApiWrappedResponse({
    status: HttpStatus.OK,
    description: 'Todas las sesiones han sido cerradas',
    type: MessageWithCountResponseDto,
  })
  async revokeAllSessions(
    @Req() req: Request,
    @GetUser() user: JwtPayload,
  ): Promise<MessageWithCountResponseDto> {
    return await this.revokeAllSessionsUseCase.execute(user.sub)
  }
}

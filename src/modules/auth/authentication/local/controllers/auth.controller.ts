import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ResponseMessage } from '@core/http'
import {
  ApiWrappedResponse,
  ApiOkResponse as ApiOkSwaggerResponse,
  ApiNotFoundResponse as ApiNotFoundSwaggerResponse,
  ApiStandardResponses,
} from '@core/swagger'
import type { Request, Response } from 'express'
import { CookieService } from '@core/http'
import { ConnectionInfo, type ConnectionMetadata } from '@core/http'
import {
  LoginDto,
  LoginResponseDto,
  RefreshResponseDto,
  UserResponseDto,
  SwitchRoleDto,
} from '../dtos'
import { Public, GetUser, GetToken } from '../../../core/decorators'
import type { JwtPayload } from '../../../core/interfaces'
import {
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  SwitchRoleUseCase,
} from '../use-cases'
import { JwtAuthGuard } from '../../../core'

import { USERS_REPOSITORY } from '../../../../users/tokens'
import type { IUsersRepository } from '../../../../users/repositories'
@UseGuards(JwtAuthGuard)
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly switchRoleUseCase: SwitchRoleUseCase,
    private readonly cookieService: CookieService,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Login exitoso')
  @ApiOperation({ summary: 'Login de usuario' })
  @ApiOkSwaggerResponse(
    LoginResponseDto,
    'Login exitoso. Puede requerir 2FA si está habilitado.',
  )
  @ApiStandardResponses({ exclude: [403] })
  @ApiWrappedResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Demasiados intentos fallidos',
  })
  async login(
    @Body() loginDto: LoginDto,
    @ConnectionInfo() connection: ConnectionMetadata,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    // Leer cookie de trusted device (si existe)
    const deviceId = this.cookieService.getTrustedDeviceToken(req)

    const { response, refreshToken } = await this.loginUseCase.execute(
      loginDto,
      connection,
      deviceId,
    )

    // Configurar refresh token en HTTP-only cookie (solo si existe)
    // Si requiere 2FA, no hay refreshToken todavía
    if (refreshToken) {
      this.cookieService.setRefreshToken(res, refreshToken, loginDto.rememberMe)
    }

    // Retornar solo access token y datos del usuario
    return response
  }

  /**
   * POST /auth/refresh
   *
   * Renueva el access token usando el refresh token de la cookie
   * Implementa token rotation: el refresh token viejo se revoca y se genera uno nuevo
   *
   * @param req - Express request para leer cookies
   * @param connection - Metadata de conexión (IP, User-Agent)
   * @param res - Express response para setear nueva cookie
   * @returns Nuevo access token
   *
   * @example
   * ```
   * POST /auth/refresh
   * Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * ```
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Token renovado exitosamente')
  @ApiOperation({ summary: 'Renovar access token (con rotation)' })
  @ApiOkSwaggerResponse(
    RefreshResponseDto,
    'Token renovado exitosamente. El refresh token se rota automáticamente en cookie.',
  )
  @ApiStandardResponses({ exclude: [403, 400] })
  async refresh(
    @Req() req: Request,
    @ConnectionInfo() connection: ConnectionMetadata,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const oldRefreshToken = this.cookieService.getRefreshToken(req)

    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token no encontrado')
    }

    const result = await this.refreshTokenUseCase.execute(
      oldRefreshToken,
      connection,
    )

    // Setear nuevo refresh token (rotation)
    this.cookieService.setRefreshToken(
      res,
      result.refreshToken,
      result.rememberMe,
    )

    // Retornar nuevo access token
    return {
      accessToken: result.accessToken,
    }
  }

  /**
   * POST /auth/logout
   *
   * Cierra la sesión del usuario:
   * - Blacklist del access token (revocación inmediata)
   * - Revocación del refresh token en Redis
   * - Limpieza de la cookie
   *
   * @param user - Usuario autenticado (del JWT)
   * @param req - Express request para leer headers y cookies
   * @param res - Express response para limpiar cookie
   *
   * @example
   * ```
   * POST /auth/logout
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * ```
   */
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Logout exitoso')
  @ApiOperation({ summary: 'Logout de usuario' })
  @ApiWrappedResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Logout exitoso. Tokens revocados y cookie limpiada.',
  })
  @ApiStandardResponses({ exclude: [400, 403] })
  async logout(
    @GetUser() user: JwtPayload,
    @GetToken() accessToken: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    // Extraer refresh token de la cookie
    const refreshToken = this.cookieService.getRefreshToken(req)

    if (!accessToken) {
      throw new UnauthorizedException('Access token no encontrado')
    }

    // Revocar ambos tokens
    await this.logoutUseCase.execute(user.sub, accessToken, refreshToken)

    // Limpiar cookie
    this.cookieService.clearRefreshToken(res)
  }

  /**
   * GET /auth/me
   *
   * Obtiene el perfil del usuario autenticado
   * Retorna toda la información del usuario incluyendo organización y rutas de navegación
   *
   * @param user - Usuario autenticado (del JWT)
   * @returns Perfil completo del usuario con navegación
   *
   * @example
   * ```
   * GET /auth/me
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * ```
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Perfil obtenido exitosamente')
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado con navegación',
    description:
      'Retorna la información completa del usuario actual incluyendo datos de su organización y rutas de navegación basadas en sus roles',
  })
  @ApiOkSwaggerResponse(UserResponseDto, 'Perfil del usuario con navegación')
  @ApiNotFoundSwaggerResponse('Usuario no encontrado')
  @ApiStandardResponses({ exclude: [400, 403] })
  async getProfile(@GetUser() user: JwtPayload): Promise<UserResponseDto> {
    const profile = await this.usersRepository.getProfile(user.sub)

    if (!profile) {
      throw new NotFoundException('Usuario no encontrado')
    }

    return {
      id: profile.id,
      names: profile.names,
      lastNames: profile.lastNames,
      username: profile.username,
      ci: profile.ci,
      phone: profile.phone,
      address: profile.address,
      email: profile.email,
      image: profile.image,
      roles: profile.roles,
      currentRole: user.currentRole, // ← Desde el JWT
      organizationId: profile.organizationId,
      organizationName: profile.organization?.name || 'Sin organización',
      organizationImage: profile.organization?.logoUrl || null,
    }
  }

  /**
   * POST /auth/switch-role
   *
   * Cambia el rol activo del usuario autenticado
   * Actualiza el currentRole en Redis para que persista en futuros refreshes
   *
   * @param user - Usuario autenticado (del JWT)
   * @param dto - Rol nuevo que el usuario quiere activar
   * @returns Nuevo access token con el rol cambiado
   *
   * @example
   * ```
   * POST /auth/switch-role
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * {
   *   "newRole": "AUDITOR"
   * }
   * ```
   */
  @ApiBearerAuth()
  @Post('switch-role')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Rol cambiado exitosamente')
  @ApiOperation({
    summary: 'Cambiar rol activo del usuario',
    description:
      'Permite al usuario cambiar entre sus roles asignados. El cambio persiste en todas las sesiones activas y futuros refreshes.',
  })
  @ApiOkSwaggerResponse(
    RefreshResponseDto,
    'Rol cambiado exitosamente. Nuevo access token generado.',
  )
  @ApiStandardResponses({ exclude: [400] })
  async switchRole(
    @Req() req: Request,
    @GetToken() currentAccessToken: string,
    @Body() dto: SwitchRoleDto,
    @ConnectionInfo() connection: ConnectionMetadata,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const oldRefreshToken = this.cookieService.getRefreshToken(req)

    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token no encontrado')
    }
    const result = await this.switchRoleUseCase.execute(
      currentAccessToken,
      dto,
      oldRefreshToken,
      connection,
    )

    this.cookieService.setRefreshToken(
      res,
      result.refreshToken,
      result.rememberMe,
    )
    return {
      accessToken: result.accessToken,
    }
  }
}

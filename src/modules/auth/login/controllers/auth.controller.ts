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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { CookieService } from '@core/http/services/cookie.service'
import { ConnectionInfo, type ConnectionMetadata } from '@core/common'
import { LoginDto, LoginResponseDto, MeResponseDto } from '../dtos'
import { Public, GetUser, GetToken } from '../../shared/decorators'
import type { JwtPayload } from '../../shared/interfaces'
import { LoginUseCase, LogoutUseCase, RefreshTokenUseCase } from '../use-cases'
import { JwtAuthGuard } from '../../shared'
import { NavigationService } from '@shared'
import { USERS_REPOSITORY } from '../../../users/tokens'
import type { IUsersRepository } from '../../../users/repositories'
@UseGuards(JwtAuthGuard)
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly cookieService: CookieService,
    private readonly navigationService: NavigationService,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  /**
   * POST /auth/login
   * Autentica un usuario con username/email y password
   *
   * @param loginDto - Credenciales de login
   * @param connection - Metadata de conexión (IP, User-Agent)
   * @param res - Express response para setear cookies
   * @returns Access token y datos del usuario
   *
   * @example
   * ```json
   * POST /auth/login
   * {
   *   "usernameOrEmail": "admin@example.com",
   *   "password": "SecurePass123!"
   * }
   * ```
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuario' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login exitoso',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Credenciales inválidas o usuario inactivo',
  })
  @ApiResponse({
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
      deviceId, // Pasar deviceId al use case
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
  @ApiOperation({ summary: 'Renovar access token (con rotation)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token renovado exitosamente',
    schema: {
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token inválido, revocado o expirado',
  })
  async refresh(
    @Req() req: Request,
    @ConnectionInfo() connection: ConnectionMetadata,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
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
  @ApiOperation({ summary: 'Logout de usuario' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Logout exitoso',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autenticado',
  })
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
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado con navegación',
    description:
      'Retorna la información completa del usuario actual incluyendo datos de su organización y rutas de navegación basadas en sus roles',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil del usuario con navegación',
    type: MeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autenticado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuario no encontrado',
  })
  async getProfile(@GetUser() user: JwtPayload): Promise<MeResponseDto> {
    const profile = await this.usersRepository.getProfile(user.sub)

    if (!profile) {
      throw new NotFoundException('Usuario no encontrado')
    }

    // Obtener rutas de navegación según los roles del usuario
    const navigation = this.navigationService.getNavigationForUser(
      profile.roles,
    )

    return {
      id: profile.id,
      names: profile.names,
      lastNames: profile.lastNames,
      email: profile.email,
      username: profile.username,
      ci: profile.ci,
      phone: profile.phone,
      address: profile.address,
      image: profile.image,
      isActive: profile.isActive,
      emailVerified: profile.emailVerified,
      emailVerifiedAt: profile.emailVerifiedAt,
      isTwoFactorEnabled: profile.isTwoFactorEnabled,
      roles: profile.roles,
      organizationId: profile.organizationId,
      organizationName: profile.organization?.name || 'Sin organización',
      organizationImage: profile.organization?.logoUrl || null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      navigation,
    }
  }
}

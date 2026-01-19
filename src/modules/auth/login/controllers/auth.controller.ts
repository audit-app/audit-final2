import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
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
import { TrustedDeviceRepository } from '../../trusted-devices'
import { JwtAuthGuard } from '../../shared'
import { NavigationService } from '../../shared/services'
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
    private readonly trustedDeviceRepository: TrustedDeviceRepository,
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
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { response, refreshToken } = await this.loginUseCase.execute(
      loginDto,
      connection,
    )

    // Configurar refresh token en HTTP-only cookie (solo si existe)
    // Si requiere 2FA, no hay refreshToken todavía
    if (refreshToken) {
      this.cookieService.setRefreshToken(res, refreshToken)
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
    this.cookieService.setRefreshToken(res, result.refreshToken)

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

  /**
   * GET /auth/trusted-devices
   *
   * Obtiene la lista de dispositivos marcados como confiables para el usuario autenticado
   * Estos dispositivos tienen bypass automático de 2FA por 90 días
   *
   * @param user - Usuario autenticado (del JWT)
   * @returns Lista de dispositivos con metadata (browser, os, IP, fechas)
   *
   * @example
   * ```
   * GET /auth/trusted-devices
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * ```
   */
  @Get('trusted-devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar dispositivos confiables',
    description:
      'Obtiene la lista de dispositivos marcados como confiables para bypass de 2FA',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de dispositivos confiables',
    schema: {
      type: 'array',
      items: {
        properties: {
          fingerprint: { type: 'string', example: 'a1b2c3d4...' },
          browser: { type: 'string', example: 'Chrome' },
          os: { type: 'string', example: 'Windows' },
          device: { type: 'string', example: 'Desktop' },
          ip: { type: 'string', example: '192.168.1.1' },
          createdAt: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
          lastUsedAt: { type: 'string', example: '2024-01-20T15:45:00.000Z' },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autenticado',
  })
  async getTrustedDevices(@GetUser() user: JwtPayload) {
    return await this.trustedDeviceRepository.getUserDevices(user.sub)
  }

  /**
   * DELETE /auth/trusted-devices/:fingerprint
   *
   * Elimina un dispositivo específico de la lista de confiables
   * El usuario necesitará 2FA nuevamente en ese dispositivo
   *
   * @param user - Usuario autenticado (del JWT)
   * @param fingerprint - Hash SHA-256 del dispositivo
   *
   * @example
   * ```
   * DELETE /auth/trusted-devices/a1b2c3d4e5f6...
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * ```
   */
  @Delete('trusted-devices/:fingerprint')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar dispositivo confiable específico',
    description:
      'Elimina un dispositivo de la lista de confiables. El próximo login requerirá 2FA nuevamente.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dispositivo eliminado exitosamente',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Dispositivo eliminado exitosamente',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dispositivo no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autenticado',
  })
  async removeTrustedDevice(
    @GetUser() user: JwtPayload,
    @Param('fingerprint') fingerprint: string,
  ) {
    const removed = await this.trustedDeviceRepository.delete(
      user.sub,
      fingerprint,
    )

    if (!removed) {
      throw new NotFoundException('Dispositivo no encontrado')
    }

    return {
      message: 'Dispositivo eliminado exitosamente',
    }
  }

  /**
   * DELETE /auth/trusted-devices
   *
   * Elimina TODOS los dispositivos confiables del usuario
   * Útil cuando quiere forzar 2FA en todos los dispositivos
   *
   * @param user - Usuario autenticado (del JWT)
   *
   * @example
   * ```
   * DELETE /auth/trusted-devices
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * ```
   */
  @Delete('trusted-devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar TODOS los dispositivos confiables',
    description:
      'Revoca todos los dispositivos confiables del usuario. Requiere 2FA en todos los próximos logins.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Todos los dispositivos fueron eliminados',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: '3 dispositivo(s) eliminado(s) exitosamente',
        },
        count: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autenticado',
  })
  async revokeAllTrustedDevices(@GetUser() user: JwtPayload) {
    const count = await this.trustedDeviceRepository.deleteAllForUser(user.sub)

    return {
      message: `${count} dispositivo(s) eliminado(s) exitosamente`,
      count,
    }
  }
}

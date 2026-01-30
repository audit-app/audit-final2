import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger'
import type { Response, Request } from 'express'
import { GoogleLoginUseCase } from '../use-cases'
import { envs } from '@core/config'
import { CookieService } from '@core/http'
import { Public } from '../../../core'
import { GoogleUser } from '../../../core/interfaces'
import { ConnectionInfo } from '@core/http'
import type { ConnectionMetadata } from '@core/http'

// TRUCO DE TYPESCRIPT:
// 1. Tomamos el Request de Express.
// 2. Le quitamos (Omit) la propiedad 'user' que da problemas.
// 3. Le agregamos (&) nuestra propia propiedad 'user' tipo GoogleUser.
type GoogleAuthRequest = Omit<Request, 'user'> & { user: GoogleUser }

@ApiTags('Google OAuth')
@Controller('auth/google')
export class GoogleAuthController {
  constructor(
    private readonly googleLoginUseCase: GoogleLoginUseCase,
    private readonly cookieService: CookieService,
  ) {}

  @Public()
  @Get()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Iniciar autenticación con Google OAuth',
    description:
      'Redirige al usuario a la página de login de Google. Después de autenticarse, ' +
      'Google redirige al callback (/auth/google/callback).',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirige a Google OAuth',
  })
  async googleAuth() {
    // Este método está vacío porque Passport maneja la redirección automáticamente
  }

  @Public()
  @Get('callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Callback de Google OAuth',
    description:
      'Endpoint de callback al que Google redirige después de la autenticación. ' +
      'Procesa el login, genera tokens JWT y redirige al frontend con el access token o token 2FA.',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description:
      'Redirige al frontend con access token (si no requiere 2FA) o con tempToken (si requiere 2FA)',
    headers: {
      Location: {
        description: 'URL de redirección al frontend',
        schema: {
          type: 'string',
          example:
            'https://frontend.com/auth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
      'Set-Cookie': {
        description: 'Cookie HTTP-only con refresh token (si no requiere 2FA)',
        schema: {
          type: 'string',
          example: 'refreshToken=jwt-token; HttpOnly; Secure; SameSite=Strict',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Autenticación de Google falló o usuario inactivo',
  })
  async googleAuthRedirect(
    @Req() req: GoogleAuthRequest,
    @Res() res: Response,
    @ConnectionInfo() connection: ConnectionMetadata,
  ) {
    // TypeScript sabe que req.user es un GoogleUser
    const googleUser = req.user

    const deviceId = this.cookieService.getTrustedDeviceToken(
      req as unknown as Request,
    )

    const { response, refreshToken } = await this.googleLoginUseCase.execute(
      googleUser,
      connection,
      deviceId,
    )

    // --- LÓGICA DE REDIRECCIÓN FINAL ---

    // 1. Guardar Refresh Token en Cookie (si existe)
    if (refreshToken) {
      this.cookieService.setRefreshToken(res, refreshToken, true)
    }

    // 2. Construir la URL del Frontend (configuración centralizada)
    const frontendUrl = envs.frontend.url

    // 3. Decidir a dónde enviar al usuario
    let redirectUrl = ''

    if (response.require2FA) {
      redirectUrl = `${frontendUrl}/api/auth/verify-2fa?tempToken=${response.twoFactorToken}`
    } else {
      redirectUrl = `${frontendUrl}/auth/callback?token=${response.accessToken}`
    }

    // Redirigir al navegador hacia el frontend
    res.redirect(redirectUrl)
  }
}

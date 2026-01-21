import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import type { Response, Request } from 'express'
import { GoogleLoginUseCase } from '../login/use-cases'
import { envs } from '@core/config'
import { CookieService } from '@core/http/services/cookie.service'
import { Public } from '../shared'
import { GoogleUser } from '../shared/interfaces'
import { ConnectionInfo } from '@core/common'
import type { ConnectionMetadata } from '@core/common'

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
  @ApiOperation({ summary: 'Iniciar autenticación con Google' })
  async googleAuth() {}

  @Public()
  @Get('callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback de Google OAuth' })
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

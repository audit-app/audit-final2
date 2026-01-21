import { Injectable } from '@nestjs/common'
import { Request, Response, CookieOptions } from 'express'
import { AppConfigService } from '@core/config'

@Injectable()
export class CookieService {
  private readonly isProduction: boolean

  // Nombres de cookies (Constantes)
  private readonly REFRESH_TOKEN_COOKIE = 'refreshToken'
  private readonly TRUSTED_DEVICE_COOKIE = 'trustedDevice'

  constructor(private readonly config: AppConfigService) {
    // Usamos la configuración centralizada
    this.isProduction = this.config.app.isProduction
  }

  // =================================================================
  // REFRESH TOKEN
  // =================================================================
  setRefreshToken(res: Response, token: string, rememberMe: boolean): void {
    const options = this.getSafeCookieOptions()

    if (rememberMe) {
      // Leemos de la configuración centralizada
      // Redis usa SEGUNDOS, cookies usan MILISEGUNDOS
      const expiresInSeconds = this.config.auth.jwt.refresh.expirationTime
      options.maxAge = expiresInSeconds * 1000
    }

    res.cookie(this.REFRESH_TOKEN_COOKIE, token, options)
  }

  getRefreshToken(req: Request): string | undefined {
    return this.getCookieValue(req, this.REFRESH_TOKEN_COOKIE)
  }

  clearRefreshToken(res: Response): void {
    // Para borrar, no necesitamos el maxAge, pero sí path y domain si existen
    const options = this.getSafeCookieOptions()
    res.clearCookie(this.REFRESH_TOKEN_COOKIE, options)
  }

  // =================================================================
  // TRUSTED DEVICE (2FA)
  // =================================================================
  setTrustedDeviceToken(res: Response, token: string): void {
    const options = this.getSafeCookieOptions()

    // Leemos de la configuración centralizada
    const expiresInSeconds =
      this.config.auth.twoFactor.trustedDevice.expirationSeconds

    options.maxAge = expiresInSeconds * 1000

    res.cookie(this.TRUSTED_DEVICE_COOKIE, token, options)
  }

  getTrustedDeviceToken(req: Request): string | undefined {
    return this.getCookieValue(req, this.TRUSTED_DEVICE_COOKIE)
  }

  // =================================================================
  // HELPERS
  // =================================================================

  private getSafeCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.isProduction,
      // SameSite: 'Strict' es muy seguro, pero considera 'Lax' si tienes problemas
      // con enlaces desde correos electrónicos. Para APIs internas, 'Strict' está bien.
      sameSite: 'strict',
      path: '/',
    }
  }

  private getCookieValue(req: Request, key: string): string | undefined {
    const value = req.cookies?.[key] as unknown
    return typeof value === 'string' ? value : undefined
  }
}

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request, Response, CookieOptions } from 'express'

@Injectable()
export class CookieService {
  private readonly isProduction: boolean

  // Nombres de cookies (Constantes)
  private readonly REFRESH_TOKEN_COOKIE = 'refreshToken'
  private readonly TRUSTED_DEVICE_COOKIE = 'trustedDevice'

  constructor(private readonly configService: ConfigService) {
    // 1. Usamos ConfigService para el entorno
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production'
  }

  // =================================================================
  // REFRESH TOKEN
  // =================================================================
  setRefreshToken(res: Response, token: string, rememberMe: boolean): void {
    const options = this.getSafeCookieOptions()

    if (rememberMe) {
      // 2. Leemos del ENV. Importante: Redis suele configurarse en SEGUNDOS.
      // Multiplicamos por 1000 para pasar a MILISEGUNDOS para la cookie.
      const expiresInSeconds = this.configService.get<number>(
        'JWT_REFRESH_EXPIRATION_TIME',
        604800,
      ) // Default 7 días
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

    // 3. Leemos del ENV específico para 2FA
    // Ej: TWO_FACTOR_TRUSTED_DEVICE_EXPIRATION = 7776000 (90 días en segundos)
    const expiresInSeconds = this.configService.get<number>(
      'TWO_FACTOR_TRUSTED_DEVICE_EXPIRATION',
      7776000,
    )

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
      // 4. SameSite: 'Strict' es muy seguro, pero considera 'Lax' si tienes problemas
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

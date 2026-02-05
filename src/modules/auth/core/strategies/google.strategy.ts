import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import {
  Strategy,
  StrategyOptions,
  VerifyCallback,
  Profile,
} from 'passport-google-oauth20'
import { envs } from '@core/config'
import { GoogleUser } from '../../core/interfaces'

/**
 * Google OAuth Strategy
 *
 * Flujo:
 * 1. Usuario hace clic en "Login con Google"
 * 2. Google autentica al usuario
 * 3. Google nos devuelve el profile del usuario
 * 4. Extraemos email y providerId (sub)
 * 5. Continuamos con nuestro flujo normal de login
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: envs.google.clientId,
      clientSecret: envs.google.clientSecret,
      callbackURL: envs.google.callbackUrl,
      scope: ['email', 'profile'],
    } as StrategyOptions)
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const user: GoogleUser = {
      providerId: profile.id,
      email: profile.emails?.[0]?.value || '',
      names: profile.name?.givenName || '',
      lastNames: profile.name?.familyName || '',
      picture: profile.photos?.[0]?.value,
    }

    done(null, user)
  }
}

import { Injectable, Inject, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { envs } from '@core/config'
import { TokensService } from '../services/tokens.service'
import { USERS_REPOSITORY } from '../../../users/tokens'
import type { IUsersRepository } from '../../../users/repositories'

import type { Request } from 'express'
import type { JwtPayload } from '@core'
import { UserNotActiveException } from '../exceptions'

/**
 * JWT Strategy (Passport)
 *
 * Maneja la validación de access tokens
 * Usado para proteger rutas que requieren autenticación
 *
 * Verifica:
 * - Que el token sea válido y no haya expirado
 * - Que el token no esté en blacklist (logout)
 * - Que el usuario exista
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly tokensService: TokensService,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envs.jwt.accessSecret,
      passReqToCallback: true, // Para acceder al token original
    })
  }

  /**
   * Valida el payload del JWT y verifica blacklist
   *
   * Este método es llamado automáticamente por Passport
   * después de que el token JWT ha sido verificado
   *
   * @param req - Request de Express (para extraer el token)
   * @param payload - Payload decodificado del JWT
   * @returns Payload validado (se adjunta a req.user)
   */
  async validate(req: Request, payload: JwtPayload): Promise<JwtPayload> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req)

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado')
    }

    const isBlacklisted = await this.tokensService.isTokenBlacklisted(token)
    if (isBlacklisted) {
      throw new UnauthorizedException('Token revocado')
    }

    const user = await this.usersRepository.findById(payload.sub)
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado')
    }
    if (!user.isActive) {
      throw new UserNotActiveException()
    }
    return payload
  }
}

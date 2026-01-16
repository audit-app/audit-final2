import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { UAParser } from 'ua-parser-js'
import ms from 'ms'
import { JwtTokenHelper } from '../../shared/helpers'
import { TokenStorageRepository } from './token-storage.repository'
import { UserEntity } from '../../../users/entities/user.entity'
import { JwtPayload, JwtRefreshPayload } from '../../shared'

@Injectable()
export class TokensService {
  // Variables cacheadas para performance y seguridad
  private readonly accessTokenExpires: string
  private readonly refreshTokenExpires: string
  private readonly refreshTokenSecret: string

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly jwtTokenHelper: JwtTokenHelper,
    private readonly tokenStorage: TokenStorageRepository,
  ) {
    this.accessTokenExpires = this.configService.get('JWT_EXPIRES_IN', '15m')
    this.refreshTokenExpires = this.configService.getOrThrow(
      'JWT_REFRESH_EXPIRES_IN',
    )
    this.refreshTokenSecret =
      this.configService.getOrThrow('JWT_REFRESH_SECRET')
  }

  async generateTokenPair(
    user: UserEntity,
    ip: string,
    userAgent: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenId = this.tokenStorage.generateTokenId()

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      organizationId: user.organizationId,
    }

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      tokenId,
    }

    // UNIFICACIÓN: Usamos jwtService para AMBOS.
    // NestJS permite sobrescribir 'secret' y 'expiresIn' en cada llamada.
    const [accessToken, refreshToken] = await Promise.all([
      // 1. Access Token (Usa el secret por defecto del JwtModule)
      this.jwtService.signAsync(accessPayload, {
        expiresIn: this.accessTokenExpires as ms.StringValue,
      }),

      // 2. Refresh Token (Sobrescribimos con SU propio secret y tiempo)
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshTokenSecret, // <--- IMPORTANTE: Secret específico
        expiresIn: this.refreshTokenExpires as ms.StringValue, // <--- IMPORTANTE: Tiempo específico
      }),
    ])

    // Metadata
    const ttlSeconds = this.jwtTokenHelper.getExpirySeconds(
      this.refreshTokenExpires,
    )
    const metadata = this.parseUserAgent(userAgent, ip)

    await this.tokenStorage.save(user.id, tokenId, ttlSeconds, metadata)

    return { accessToken, refreshToken }
  }

  // --- BLACKLIST (SOLO PARA ACCESS TOKENS) ---
  async blacklistAccessToken(token: string, userId: string): Promise<void> {
    // Access Tokens son stateless, por eso necesitamos Blacklist.
    const decoded = this.jwtService.decode<JwtPayload>(token)

    if (!decoded?.exp) return

    const now = Math.floor(Date.now() / 1000)
    const ttlSeconds = decoded.exp - now

    if (ttlSeconds > 0) {
      // Guardamos en Redis: "Este token específico está prohibido"
      await this.tokenStorage.blacklistToken(token, userId, ttlSeconds)
    }
  }

  // --- REVOCACIÓN (SOLO PARA REFRESH TOKENS) ---
  async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
    // Refresh Tokens son stateful, simplemente los borramos.
    await this.tokenStorage.delete(userId, tokenId)
  }

  // ... (validateRefreshToken, isTokenBlacklisted, revokeAllUserTokens siguen igual) ...

  // Helpers privados
  private parseUserAgent(userAgent: string, ip: string) {
    const parser = new UAParser(userAgent)
    const result = parser.getResult()
    return {
      ip,
      userAgent,
      browser:
        `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
      os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
      device: result.device.type || 'Desktop',
    }
  }

  // Helpers públicos
  async validateRefreshToken(
    userId: string,
    tokenId: string,
  ): Promise<boolean> {
    return this.tokenStorage.validate(userId, tokenId)
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.tokenStorage.deleteAllForUser(userId)
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.tokenStorage.isBlacklisted(token)
  }
}

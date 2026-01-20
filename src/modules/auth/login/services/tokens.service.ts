import { Injectable } from '@nestjs/common'
import {
  JwtService,
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
} from '@nestjs/jwt'
import ms from 'ms'
import { ConnectionMetadataService } from '@core/common'
import type { ConnectionMetadata } from '@core/common'
import { LoggerService } from '@core/logger'
import {
  TokenStorageRepository,
  StoredSession, // Importamos la interfaz desde el nuevo repo
} from './token-storage.repository'
import { UserEntity } from '../../../users/entities/user.entity'
import { JwtPayload, JwtRefreshPayload } from '../../shared'
import { InvalidTokenException } from '../exceptions'
import { LOGIN_CONFIG } from '../config/login.config'

@Injectable()
export class TokensService {
  private readonly accessTokenExpires: string
  private readonly refreshTokenExpires: string
  private readonly refreshTokenSecret: string
  private readonly jwtSecret: string

  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenStorage: TokenStorageRepository,
    private readonly connectionMetadataService: ConnectionMetadataService,
    private readonly logger: LoggerService,
  ) {
    this.accessTokenExpires = LOGIN_CONFIG.jwt.access.expiresIn
    this.refreshTokenExpires = LOGIN_CONFIG.jwt.refresh.expiresIn
    this.refreshTokenSecret = LOGIN_CONFIG.jwt.refresh.secret
    this.jwtSecret = LOGIN_CONFIG.jwt.access.secret
  }

  async generateTokenPair(
    user: UserEntity,
    connection: ConnectionMetadata,
    rememberMe: boolean,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Generamos ID usando el helper del repo
    const tokenId = this.tokenStorage.generateTokenId()

    // 2. Preparamos Payloads
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

    // 3. Firmamos Tokens en paralelo
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        expiresIn: this.accessTokenExpires as ms.StringValue,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshTokenSecret,
        expiresIn: this.refreshTokenExpires as ms.StringValue,
      }),
    ])

    // 4. Parsear metadata
    const parsedMetadata = this.connectionMetadataService.parse(connection)

    // 5. Construir el objeto de sesión COMPLETO
    // El repositorio espera el objeto listo para guardar (T)
    const sessionData: StoredSession = {
      tokenId,
      userId: user.id,
      ip: parsedMetadata.ip,
      userAgent: parsedMetadata.userAgent,
      browser: parsedMetadata.browser,
      os: parsedMetadata.os,
      device: parsedMetadata.device,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      rememberMe,
    }

    // 6. Guardar en Redis
    // NOTA: Ya no pasamos TTL aquí, el repositorio usa su configuración interna
    await this.tokenStorage.save(user.id, sessionData)

    return { accessToken, refreshToken }
  }

  async getStoredSession(
    userId: string,
    tokenId: string,
  ): Promise<StoredSession | null> {
    // CAMBIO: Usamos 'findOne' que viene de la clase abstracta
    return this.tokenStorage.findOne(userId, tokenId)
  }

  // --- BLACKLIST (Access Tokens - Stateless) ---
  async blacklistAccessToken(token: string, userId: string): Promise<void> {
    const decoded = this.jwtService.decode<JwtPayload>(token)
    if (!decoded?.exp) return

    const now = Math.floor(Date.now() / 1000)
    const ttlSeconds = decoded.exp - now

    if (ttlSeconds > 0) {
      await this.tokenStorage.blacklistToken(token, userId, ttlSeconds)
    }
  }

  // --- REVOCACIÓN (Refresh Tokens - Stateful) ---
  async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
    // CAMBIO: El método delete ahora viene de la clase abstracta
    await this.tokenStorage.delete(userId, tokenId)
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    // CAMBIO: El método deleteAllForUser ahora viene de la clase abstracta
    await this.tokenStorage.deleteAllForUser(userId)
  }

  // Helpers de validación
  async validateRefreshToken(
    userId: string,
    tokenId: string,
  ): Promise<boolean> {
    // CAMBIO: validate viene de la clase abstracta (verifica Set + JSON)
    return this.tokenStorage.validate(userId, tokenId)
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.tokenStorage.isBlacklisted(token)
  }

  // --- METODOS DE UTILERÍA JWT ---

  decodeRefreshToken(refreshToken: string): JwtRefreshPayload {
    return this.jwtService.decode(refreshToken)
  }

  verifyRefreshToken(token: string): JwtRefreshPayload {
    try {
      return this.jwtService.verify<JwtRefreshPayload>(token, {
        secret: this.refreshTokenSecret,
      })
    } catch (error) {
      this.handleJwtError(error, 'TokensService.verifyRefreshToken')
      throw new InvalidTokenException('Refresh token inválido o expirado')
    }
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.jwtSecret,
      })
    } catch (error) {
      this.handleJwtError(error, 'TokensService.verifyAccessToken')
      throw new InvalidTokenException('Access token inválido o expirado')
    }
  }

  private handleJwtError(error: unknown, context: string): void {
    if (error instanceof TokenExpiredError) {
      this.logger.warn(
        `Token expirado: ${error.expiredAt.toISOString()}`,
        context,
      )
    } else if (error instanceof JsonWebTokenError) {
      this.logger.error(error, undefined, `${context}.InvalidSignature`)
    } else if (error instanceof NotBeforeError) {
      this.logger.warn(
        `Token not active yet (nbf: ${error.date.toISOString()})`,
        context,
      )
    } else {
      this.logger.error(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        `${context}.Unknown`,
      )
    }
  }
}

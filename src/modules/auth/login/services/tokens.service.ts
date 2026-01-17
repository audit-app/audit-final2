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
import { TokenStorageRepository } from './token-storage.repository'
import { UserEntity } from '../../../users/entities/user.entity'
import { JwtPayload, JwtRefreshPayload } from '../../shared'
import { InvalidTokenException } from '../exceptions'
import { TimeUtil } from '@core/utils'
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

    // Parsear metadata de conexión usando el servicio centralizado
    const ttlSeconds = TimeUtil.toSeconds(this.refreshTokenExpires)
    const parsedMetadata = this.connectionMetadataService.parse(connection)

    // Guardar en Redis (adaptamos ParsedConnectionMetadata a SessionMetadata)
    await this.tokenStorage.save(user.id, tokenId, ttlSeconds, {
      ip: parsedMetadata.ip,
      userAgent: parsedMetadata.userAgent,
      browser: parsedMetadata.browser,
      os: parsedMetadata.os,
      device: parsedMetadata.device,
    })

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

  //METODOS JWT RAW

  decodeRefreshToken(refreshToken: string): JwtRefreshPayload {
    return this.jwtService.decode(refreshToken)
  }

  // --- VERIFICACIÓN CENTRALIZADA DE TOKENS ---

  /**
   * Verifica un Refresh Token centralizando el manejo de errores y logs
   *
   * @param token - Refresh token a verificar
   * @returns Payload decodificado del token
   * @throws InvalidTokenException si el token es inválido o expirado
   */
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

  /**
   * Verifica un Access Token (útil para logout, validaciones manuales)
   *
   * @param token - Access token a verificar
   * @returns Payload decodificado del token
   * @throws InvalidTokenException si el token es inválido o expirado
   */
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

  // --- MANEJO CENTRALIZADO DE ERRORES JWT ---

  /**
   * Helper privado para manejar errores de JWT de forma consistente
   * Centraliza los logs para no repetir la lógica en cada método
   *
   * @param error - Error capturado de jwtService.verify
   * @param context - Contexto para los logs (método que llamó)
   */
  private handleJwtError(error: unknown, context: string): void {
    if (error instanceof TokenExpiredError) {
      // Token expirado (caso normal, nivel WARN)
      this.logger.warn(
        `Token expirado: ${error.expiredAt.toISOString()}`,
        context,
      )
    } else if (error instanceof JsonWebTokenError) {
      // Firma inválida o token malformado (caso raro, nivel ERROR)
      this.logger.error(error, undefined, `${context}.InvalidSignature`)
    } else if (error instanceof NotBeforeError) {
      // Token del futuro - relojes desincronizados (nivel WARN)
      this.logger.warn(
        `Token not active yet (nbf: ${error.date.toISOString()})`,
        context,
      )
    } else {
      // Error desconocido
      this.logger.error(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        `${context}.Unknown`,
      )
    }
  }
}

import { Injectable } from '@nestjs/common'
import { AbstractUserSetRepository, CacheService } from '@core/cache'
import { v4 as uuidv4 } from 'uuid'
import { Role } from '@core'
import { envs } from '@core/config'

export interface StoredSession {
  tokenId: string
  userId: string
  currentRole: Role
  ip: string
  userAgent: string
  browser?: string
  os?: string
  device?: string
  createdAt: number
  lastActiveAt: number
  rememberMe: boolean
}

@Injectable()
export class TokenStorageRepository extends AbstractUserSetRepository<StoredSession> {
  constructor(cacheService: CacheService) {
    super(cacheService, {
      basePrefix: 'auth:refresh',
      maxItemsPerUser: envs.session.maxConcurrentSessions,
      ttlSeconds: envs.jwt.refreshExpires.seconds,
    })
  }

  protected getItemId(item: StoredSession): string {
    return item.tokenId
  }

  protected getLastActive(item: StoredSession): number {
    return item.lastActiveAt
  }

  generateTokenId(): string {
    return uuidv4()
  }

  async blacklistToken(
    token: string,
    userId: string,
    ttl: number,
  ): Promise<void> {
    const key = `auth:blacklist:${token}`
    await this.cacheService.set(key, userId, ttl)
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const key = `auth:blacklist:${token}`
    return await this.cacheService.exists(key)
  }
}

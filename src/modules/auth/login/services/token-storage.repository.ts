import { Injectable } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { CacheService } from '@core/cache'

export interface SessionMetadata {
  ip: string
  userAgent: string // El string crudo
  browser?: string // Ej: "Chrome 120" (Parseado)
  os?: string // Ej: "Windows 11" (Parseado)
  device?: string // Ej: "iPhone 13" (Parseado)
}

// Lo que guardamos en Redis (Extiende la metadata + datos técnicos)
export interface StoredSession extends SessionMetadata {
  tokenId: string
  userId: string
  createdAt: number
  lastActiveAt: number
}

@Injectable()
export class TokenStorageRepository {
  constructor(private readonly cacheService: CacheService) {}

  // Generar ID es responsabilidad de almacenamiento/identidad
  generateTokenId(): string {
    return uuidv4()
  }

  // --- LÓGICA DE KEY ---
  private getKey(userId: string, tokenId: string): string {
    return `auth:refresh:${userId}:${tokenId}`
  }

  private getUserSetKey(userId: string): string {
    return `auth:refresh:user-sets:${userId}`
  }

  // --- GUARDAR (Data + Índice) ---
  async save(
    userId: string,
    tokenId: string,
    ttl: number,
    metadata: SessionMetadata,
  ): Promise<void> {
    const key = this.getKey(userId, tokenId)
    const setKey = this.getUserSetKey(userId)

    const sessionData: StoredSession = {
      ...metadata,
      userId,
      tokenId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    }

    // 1. Guardar la data real
    await this.cacheService.setJSON(key, sessionData, ttl)

    // 2. Indexar (Set) - Valor agregado real de este servicio
    await this.cacheService.sadd(setKey, tokenId)
    await this.cacheService.expire(setKey, ttl) // El índice también expira
  }

  // --- VALIDAR (Existencia + Pertenencia) ---
  async validate(userId: string, tokenId: string): Promise<boolean> {
    const setKey = this.getUserSetKey(userId)
    // Verificamos pertenencia (más seguro que solo exists)
    return await this.cacheService.sismember(setKey, tokenId)
  }

  // --- BORRAR UNO (Data + Índice) ---
  async delete(userId: string, tokenId: string): Promise<void> {
    const key = this.getKey(userId, tokenId)
    const setKey = this.getUserSetKey(userId)

    await this.cacheService.del(key)
    await this.cacheService.srem(setKey, tokenId)
  }

  // --- BORRAR TODOS (Eficiente) ---
  async deleteAllForUser(userId: string): Promise<void> {
    const setKey = this.getUserSetKey(userId)
    const tokenIds = await this.cacheService.smembers(setKey)

    if (tokenIds.length > 0) {
      const keys = tokenIds.map((id) => this.getKey(userId, id))
      // Borrado en paralelo
      await Promise.all([
        ...keys.map((k) => this.cacheService.del(k)),
        this.cacheService.del(setKey),
      ])
    }
  }

  // --- OBTENER TODAS LAS SESIONES ---
  /**
   * Obtiene todas las sesiones activas formateadas para el Frontend.
   * Realiza el "JOIN" manual de Redis de forma eficiente.
   */
  async getUserSessions(userId: string): Promise<StoredSession[]> {
    // 1. Obtener la lista de IDs (El Índice)
    const setKey = this.getUserSetKey(userId)
    const tokenIds = await this.cacheService.smembers(setKey)

    if (tokenIds.length === 0) {
      return []
    }

    // 2. Construir las keys de los detalles
    const keys = tokenIds.map((tokenId) => this.getKey(userId, tokenId))

    // 3. Obtener todos los JSONs en paralelo (Muy rápido)
    const sessions = await Promise.all(
      keys.map((key) => this.cacheService.getJSON<StoredSession>(key)),
    )

    // 4. Filtrar nulos (limpieza de basura)
    // Puede pasar que un token expire (JSON borrado) pero quede en el Set por un segundo.
    return sessions.filter(
      (session): session is StoredSession => session !== null,
    )
  }

  // --- BLACKLIST (Global) ---
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

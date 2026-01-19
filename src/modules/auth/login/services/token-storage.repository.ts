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
  rememberMe: boolean
}

/**
 * Repository para gestionar refresh tokens en Redis
 *
 * Usa la misma estrategia dual:
 * 1. Key individual: auth:refresh:{userId}:{tokenId} → StoredSession (JSON)
 * 2. Set key: auth:refresh:user-sets:{userId} → Set de tokenIds
 *
 * Límites de seguridad:
 * - Máximo 5 sesiones activas por usuario (múltiples dispositivos)
 * - Limpieza automática de ghost members (tokenIds huérfanos en el Set)
 * - Validación doble en validate() para evitar bypass con tokens expirados
 */
@Injectable()
export class TokenStorageRepository {
  private readonly MAX_SESSIONS_PER_USER = 5

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
    rememberMe: boolean,
  ): Promise<void> {
    const key = this.getKey(userId, tokenId)
    const setKey = this.getUserSetKey(userId)

    // 1. Verificar límite de sesiones (seguridad)
    const currentTokenIds = await this.cacheService.smembers(setKey)

    // Si el token ya existe, lo actualizamos (no cuenta como nuevo)
    const isNewSession = !currentTokenIds.includes(tokenId)

    if (isNewSession && currentTokenIds.length >= this.MAX_SESSIONS_PER_USER) {
      // Límite alcanzado: borrar la sesión más vieja
      const sessions = await this.getUserSessions(userId)

      if (sessions.length > 0) {
        // Ordenar por createdAt (la más vieja primero)
        const sortedSessions = sessions.sort(
          (a, b) => a.createdAt - b.createdAt,
        )
        const oldestSession = sortedSessions[0]
        await this.delete(userId, oldestSession.tokenId)
      }
    }

    const sessionData: StoredSession = {
      ...metadata,
      userId,
      tokenId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      rememberMe,
    }

    // 2. Guardar la data real
    await this.cacheService.setJSON(key, sessionData, ttl)

    // 3. Indexar (Set) - Valor agregado real de este servicio
    await this.cacheService.sadd(setKey, tokenId)
    await this.cacheService.expire(setKey, ttl) // El índice también expira
  }

  // --- VALIDAR (Existencia + Pertenencia) ---
  /**
   * Valida si un refresh token es válido
   *
   * IMPORTANTE: Verifica AMBAS cosas:
   * 1. Que el tokenId esté en el Set (índice)
   * 2. Que el JSON de la sesión realmente exista (no sea ghost member)
   *
   * Si detecta un ghost member, lo limpia automáticamente del Set.
   *
   * @param userId - ID del usuario
   * @param tokenId - ID del refresh token
   * @returns true si el token existe y es válido
   */
  async validate(userId: string, tokenId: string): Promise<boolean> {
    const setKey = this.getUserSetKey(userId)

    // 1. Verificar pertenencia en el Set (índice)
    const inSet = await this.cacheService.sismember(setKey, tokenId)

    if (!inSet) {
      return false
    }

    // 2. Verificar que el JSON realmente existe (seguridad contra ghost members)
    const key = this.getKey(userId, tokenId)
    const exists = await this.cacheService.exists(key)

    if (!exists) {
      // Ghost member detectado: el tokenId está en el Set pero el JSON expiró
      // Limpieza automática para evitar bypass con tokens expirados
      await this.cacheService.srem(setKey, tokenId)
      return false
    }

    return true
  }

  // --- BORRAR UNO (Data + Índice) ---
  async delete(userId: string, tokenId: string): Promise<void> {
    const key = this.getKey(userId, tokenId)
    const setKey = this.getUserSetKey(userId)

    await this.cacheService.del(key)
    await this.cacheService.srem(setKey, tokenId)
  }

  // --- BORRAR TODOS (Eficiente) ---
  async deleteAllForUser(userId: string): Promise<number> {
    const setKey = this.getUserSetKey(userId)
    const tokenIds = await this.cacheService.smembers(setKey)

    if (tokenIds.length === 0) {
      return 0
    }

    const keys = tokenIds.map((id) => this.getKey(userId, id))

    // Borrado en paralelo
    await Promise.all([
      ...keys.map((k) => this.cacheService.del(k)),
      this.cacheService.del(setKey),
    ])

    return tokenIds.length
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

    // 4. Filtrar nulos y limpiar ghost members activamente
    const validSessions: StoredSession[] = []
    const ghostTokenIds: string[] = []

    sessions.forEach((session, index) => {
      if (session !== null) {
        validSessions.push(session)
      } else {
        // Ghost member detectado: el JSON expiró pero el tokenId sigue en el Set
        ghostTokenIds.push(tokenIds[index])
      }
    })

    // 5. Limpiar ghost members del Set (sincronización activa)
    // Optimización: Un solo comando Redis en lugar de múltiples
    if (ghostTokenIds.length > 0) {
      await this.cacheService.srem(setKey, ...ghostTokenIds)
    }

    // 6. Ordenar por último uso (más reciente primero)
    return validSessions.sort((a, b) => b.lastActiveAt - a.lastActiveAt)
  }
  async getSession(
    userId: string,
    tokenId: string,
  ): Promise<StoredSession | null> {
    const key = this.getKey(userId, tokenId)

    const setKey = this.getUserSetKey(userId)
    const inSet = await this.cacheService.sismember(setKey, tokenId)
    if (!inSet) return null

    return await this.cacheService.getJSON<StoredSession>(key)
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

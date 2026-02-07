import { CacheService } from './cache.service'

/**
 * Configuración para el repositorio de Sets
 */
export interface UserSetRepositoryConfig {
  basePrefix: string // Ej: "auth:refresh"
  maxItemsPerUser: number // Ej: 5
  ttlSeconds: number // Ej: 604800 (7 días)
}

/**
 * Repositorio Base Abstracto para manejar colecciones de items por usuario en Redis.
 *
 * Implementa patrón "Secondary Index":
 * - Guarda la data completa en una key única.
 * - Guarda los IDs en un Set para búsquedas rápidas.
 * - Maneja limpieza automática de "Ghost Members" (IDs sin data).
 * - Maneja política de desalojo (LRU) cuando se supera el límite.
 */
export abstract class AbstractUserSetRepository<T> {
  constructor(
    protected readonly cacheService: CacheService,
    protected readonly config: UserSetRepositoryConfig,
  ) {}

  /**
   * Define cómo obtener el ID único del item (ej: tokenId, fingerprint)
   */
  protected abstract getItemId(item: T): string

  /**
   * Define qué campo usar para ordenar y decidir cuál borrar (ej: lastActiveAt)
   */
  protected abstract getLastActive(item: T): number

  // ==========================================
  // GENERACIÓN DE KEYS
  // ==========================================

  protected getKey(userId: string, itemId: string): string {
    return `${this.config.basePrefix}:${userId}:${itemId}`
  }

  protected getUserSetKey(userId: string): string {
    return `${this.config.basePrefix}:user-sets:${userId}`
  }

  // ==========================================
  // MÉTODOS DE ESCRITURA
  // ==========================================

  /**
   * Guarda un item, manejando límites y expiración automáticamente.
   */
  async save(userId: string, item: T): Promise<void> {
    const itemId = this.getItemId(item)
    const key = this.getKey(userId, itemId)
    const setKey = this.getUserSetKey(userId)

    // 1. Verificar límite y aplicar desalojo (Eviction Policy)
    // Solo verificamos si es un item nuevo para no borrar cosas en updates
    const currentIds = await this.cacheService.smembers(setKey)
    const isNew = !currentIds.includes(itemId)

    if (isNew && currentIds.length >= this.config.maxItemsPerUser) {
      // Necesitamos borrar el más antiguo. Obtenemos todos para ordenar.
      const allItems = await this.findAllByUser(userId)

      if (allItems.length > 0) {
        // Orden ascendente (menor timestamp = más viejo)
        const sorted = allItems.sort(
          (a, b) => this.getLastActive(a) - this.getLastActive(b),
        )
        const oldest = sorted[0]
        // Borramos el más viejo para hacer espacio
        await this.delete(userId, this.getItemId(oldest))
      }
    }

    // 2. Guardar Data (JSON)
    await this.cacheService.setJSON(key, item, this.config.ttlSeconds)

    // 3. Actualizar Índice (Set)
    await this.cacheService.sadd(setKey, itemId)

    // El índice también debe expirar para no dejar basura si el usuario se va
    await this.cacheService.expire(setKey, this.config.ttlSeconds)
  }

  /**
   * Borra un item específico y lo saca del índice.
   */
  async delete(userId: string, itemId: string): Promise<boolean> {
    const key = this.getKey(userId, itemId)
    const setKey = this.getUserSetKey(userId)

    const [deleted, removedFromSet] = await Promise.all([
      this.cacheService.del(key),
      this.cacheService.srem(setKey, itemId),
    ])
    return deleted || removedFromSet > 0
  }

  /**
   * Borra TODOS los items de un usuario.
   */
  async deleteAllForUser(userId: string): Promise<number> {
    const setKey = this.getUserSetKey(userId)
    const ids = await this.cacheService.smembers(setKey)

    if (ids.length === 0) return 0

    const keys = ids.map((id) => this.getKey(userId, id))

    // Borramos todas las datas + la key del set
    await Promise.all([
      ...keys.map((k) => this.cacheService.del(k)),
      this.cacheService.del(setKey),
    ])

    return ids.length
  }

  // ==========================================
  // MÉTODOS DE LECTURA
  // ==========================================

  /**
   * Obtiene un item específico.
   * Valida integridad (que esté en el Set).
   */
  async findOne(userId: string, itemId: string): Promise<T | null> {
    const setKey = this.getUserSetKey(userId)

    // Verificación rápida de índice
    const inSet = await this.cacheService.sismember(setKey, itemId)
    if (!inSet) return null

    const key = this.getKey(userId, itemId)
    return await this.cacheService.getJSON<T>(key)
  }

  /**
   * Obtiene TODOS los items, limpia basura (ghost members) y ordena.
   */
  async findAllByUser(userId: string): Promise<T[]> {
    const setKey = this.getUserSetKey(userId)
    const ids = await this.cacheService.smembers(setKey)

    if (ids.length === 0) return []

    // Obtener todos los JSONs en paralelo
    const keys = ids.map((id) => this.getKey(userId, id))
    const items = await Promise.all(
      keys.map((k) => this.cacheService.getJSON<T>(k)),
    )

    const validItems: T[] = []
    const ghostIds: string[] = []

    // Separar válidos de inválidos (Ghost Members)
    items.forEach((item, index) => {
      if (item) {
        validItems.push(item)
      } else {
        ghostIds.push(ids[index])
      }
    })

    // Auto-Healing: Limpiar índice si encontramos basura
    if (ghostIds.length > 0) {
      await this.cacheService.srem(setKey, ...ghostIds)
    }

    // Retornar ordenado descendente (el más reciente primero)
    return validItems.sort(
      (a, b) => this.getLastActive(b) - this.getLastActive(a),
    )
  }

  /**
   * Valida existencia real (Data + Índice).
   * Si detecta inconsistencia, limpia el índice.
   */
  async validate(userId: string, itemId: string): Promise<boolean> {
    const setKey = this.getUserSetKey(userId)
    const inSet = await this.cacheService.sismember(setKey, itemId)

    if (!inSet) return false

    const key = this.getKey(userId, itemId)
    const exists = await this.cacheService.exists(key)

    if (!exists) {
      await this.cacheService.srem(setKey, itemId)
      return false
    }

    return true
  }
}

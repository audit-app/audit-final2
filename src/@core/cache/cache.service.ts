import { Injectable, Inject } from '@nestjs/common'
import Redis from 'ioredis'
import { REDIS_CLIENT } from './cache.tokens'

@Injectable()
export class CacheService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  // ============================================
  // OPERACIONES BÁSICAS (KV)
  // ============================================

  /**
   * Obtiene un valor string
   */
  async get(key: string): Promise<string | null> {
    return await this.redis.get(key)
  }

  /**
   * Almacena un valor.
   * Si se pasa ttlSeconds, usa SETEX (atómico), si no, usa SET.
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, value)
    } else {
      await this.redis.set(key, value)
    }
  }
  /**
   * Verifica existencia.
   * Retorna true/false directo.
   */
  async exists(key: string): Promise<boolean> {
    const count = await this.redis.exists(key)
    return count === 1
  }
  /**
   * Elimina una llave.
   * Retorna true si se eliminó algo, false si no existía.
   */
  async del(key: string): Promise<boolean> {
    const deleted = await this.redis.del(key)
    return deleted > 0
  }

  // ============================================
  // METADATA & EXPIRACIÓN (Clave para Rate Limit)
  // ============================================

  /**
   * Obtiene el tiempo de vida restante en segundos.
   * Retorna:
   * -1: Si no tiene expiración
   * -2: Si la llave no existe
   * >0: Segundos restantes
   */
  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key)
  }

  /**
   * Actualiza la expiración de una llave existente.
   * Retorna true si tuvo éxito (la llave existía).
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.redis.expire(key, seconds)
    return result === 1
  }

  // ============================================
  // CONTADORES (Clave para Rate Limit)
  // ============================================

  /**
   * Incrementa un valor atómicamente.
   * Si no existe, lo crea en 1.
   * Retorna el nuevo valor.
   */
  async incr(key: string): Promise<number> {
    return await this.redis.incr(key)
  }

  /**
   * Decrementa un valor atómicamente.
   */
  async decr(key: string): Promise<number> {
    return await this.redis.decr(key)
  }

  // ============================================
  // HELPERS JSON (Utilidad común)
  // ============================================

  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const stringValue = JSON.stringify(value)
    await this.set(key, stringValue, ttlSeconds)
  }

  // ============================================
  // MÉTODOS PARA SETS (ÍNDICES)
  // Son atómicos y necesarios para agrupar tokens
  // ============================================

  /**
   * Agrega uno o más valores a un Set.
   * Es atómico. Crea el set si no existe.
   */
  async sadd(key: string, value: string): Promise<number> {
    return await this.redis.sadd(key, value)
  }

  /**
   * Elimina uno o más valores de un Set.
   * Es atómico.
   *
   * @param key - La key del Set
   * @param values - Uno o más valores a eliminar
   * @returns Número de elementos eliminados
   *
   * @example
   * await srem('users:set', 'user1') // Eliminar uno
   * await srem('users:set', 'user1', 'user2', 'user3') // Eliminar varios
   * await srem('users:set', ...userIds) // Spread de array
   */
  async srem(key: string, ...values: string[]): Promise<number> {
    return await this.redis.srem(key, ...values)
  }

  /**
   * Obtiene todos los miembros.
   * Rápido para listas pequeñas (como tokens de un usuario).
   */
  async smembers(key: string): Promise<string[]> {
    return await this.redis.smembers(key)
  }

  /**
   * Verifica si un miembro existe en el Set.
   */
  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.redis.sismember(key, member)
    return result === 1
  }
}

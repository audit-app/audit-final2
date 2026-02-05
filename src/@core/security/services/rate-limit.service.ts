import { Injectable } from '@nestjs/common'
import { CacheService } from '@core/cache' // Solo importamos tu servicio

@Injectable()
export class RateLimitService {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * Verifica si se puede realizar un intento más
   * (La lógica se mantiene igual, pero usa internamente los métodos actualizados)
   */
  async checkLimit(key: string, maxAttempts: number): Promise<boolean> {
    const attempts = await this.getAttempts(key)

    if (attempts >= maxAttempts) {
      const ttl = await this.getTimeUntilReset(key)

      // Si el TTL expiró o no existe, reseteamos para permitir el intento
      if (ttl <= 0) {
        await this.resetAttempts(key)
        return true
      }

      return false
    }

    return true
  }

  /**
   * Incrementa el contador de intentos
   * CAMBIO CLAVE: Usamos .incr() para atomicidad
   */
  async incrementAttempts(key: string, windowMinutes: number): Promise<number> {
    const prefixedKey = this.getPrefixedKey(key)
    const ttlSeconds = windowMinutes

    // 1. Incremento ATÓMICO (CacheService.incr)
    // Redis maneja la suma internamente. No hay "race conditions".
    const newAttempts = await this.cacheService.incr(prefixedKey)

    // 2. Si es el primer intento (1), establecemos cuándo debe expirar.
    // Si ya existía (es 2, 3, etc.), mantenemos el TTL original para que la ventana de tiempo no se reinicie.
    if (newAttempts === 1) {
      await this.cacheService.expire(prefixedKey, ttlSeconds)
    }

    return newAttempts
  }

  /**
   * Obtiene el número de intentos actuales
   */
  async getAttempts(key: string): Promise<number> {
    const prefixedKey = this.getPrefixedKey(key)

    // Usamos CacheService.get()
    const value = await this.cacheService.get(prefixedKey)

    if (!value) {
      return 0
    }

    return parseInt(value, 10) || 0
  }

  /**
   * Resetea el contador de intentos
   */
  async resetAttempts(key: string): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key)
    await this.cacheService.del(prefixedKey)
  }

  /**
   * Obtiene los intentos restantes
   */
  async getRemainingAttempts(
    key: string,
    maxAttempts: number,
  ): Promise<number> {
    const currentAttempts = await this.getAttempts(key)
    return Math.max(0, maxAttempts - currentAttempts)
  }

  /**
   * Obtiene el tiempo restante hasta que expire el bloqueo
   */
  async getTimeUntilReset(key: string): Promise<number> {
    const prefixedKey = this.getPrefixedKey(key)
    // Usamos CacheService.ttl()
    const ttl = await this.cacheService.ttl(prefixedKey)

    // Normalizamos la respuesta de Redis (-1 o -2 significan 0 para nosotros en lógica de negocio)
    return Math.max(0, ttl)
  }

  private getPrefixedKey(key: string): string {
    return `rate-limit:${key}`
  }
}

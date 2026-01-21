import { Module, Global } from '@nestjs/common'
import { envs } from '@core/config'
import Redis from 'ioredis'
import { CacheService } from './cache.service'
import { REDIS_CLIENT } from './cache.tokens'

/**
 * Módulo de caché global usando Redis
 * @Global - Disponible en toda la aplicación sin necesidad de importar
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const redis = new Redis({
          host: envs.redis.host,
          port: envs.redis.port,
          password: envs.redis.password || undefined,
          db: envs.redis.db,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000)
            return delay
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
        })

        // Log de conexión exitosa
        redis.on('connect', () => {
          console.log('✅ Redis conectado correctamente')
        })

        // Log de errores
        redis.on('error', (err) => {
          console.error('❌ Error de conexión con Redis:', err.message)
        })

        return redis
      },
    },
    CacheService,
  ],
  exports: [REDIS_CLIENT, CacheService],
})
export class CacheModule {}

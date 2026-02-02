import { Global, Module } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'
import { TransactionService } from './transaction.service'
import { TransactionDiscoveryService } from './transaction-discovery.service'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { TypeOrmDatabaseLogger } from '@core/logger'
import { envs } from '@core/config'
import { ContextModule } from '@core/context'

/**
 * Módulo global de database implementa:
 * - TypeORM para conexión a base de datos PostgreSQL
 * - TransactionService para manejar transacciones con CLS
 * - Discovery automático de métodos @Transactional()
 *
 * Depende de:
 * - ContextModule: Proporciona ClsModule para almacenar EntityManager en CLS
 *
 * NOTA: AuditService ahora vive en @core/context porque la auditoría
 * es un cross-cutting concern (no específico de database)
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (): TypeOrmModuleOptions => {
        return {
          type: 'postgres',
          url: envs.database.url,
          synchronize: false,
          logging: envs.app.isDevelopment,
          logger: TypeOrmDatabaseLogger.createStandalone(),
          maxQueryExecutionTime: 1000,
          autoLoadEntities: true,
        }
      },
    }),
    ContextModule,
    DiscoveryModule,
  ],
  providers: [TransactionService, TransactionDiscoveryService],
  exports: [TransactionService],
})
export class DatabaseModule {}

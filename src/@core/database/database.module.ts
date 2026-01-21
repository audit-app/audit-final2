import { Global, Module } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'
import { ClsModule } from 'nestjs-cls'
import { TransactionService } from './transaction.service'
import { TransactionDiscoveryService } from './transaction-discovery.service'
import { AuditService } from './audit.service'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { TypeOrmDatabaseLogger } from '@core/logger'
import { envs } from '@core/config'

/**
 * Módulo global de database implementa:
 * - CLS (Continuation Local Storage) para request scope
 * - TransactionService para manejar transacciones
 * - AuditService para auditoría automática (createdBy/updatedBy)
 * - Discovery automático de métodos @Transactional()
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
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
      },
    }),
    DiscoveryModule,
  ],
  providers: [TransactionService, AuditService, TransactionDiscoveryService],
  exports: [TransactionService, AuditService, ClsModule],
})
export class DatabaseModule {}

import { Global, Module } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'
import { ClsModule } from 'nestjs-cls'
import { TransactionService } from './transaction.service'
import { TransactionDiscoveryService } from './transaction-discovery.service'
import { AuditService } from './audit.service'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { AppConfigService } from '@core/config'

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
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const dbConfig = config.database as TypeOrmModuleOptions
        if (!dbConfig) {
          throw new Error(
            'La configuración de la base de datos no fue cargada correctamente',
          )
        }
        return dbConfig
      },
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        // Montar CLS middleware automáticamente
        mount: true,
        // Generar ID único para cada request
        generateId: true,
      },
    }),
    // ✅ DiscoveryModule permite escanear proveedores automáticamente
    DiscoveryModule,
  ],
  providers: [
    TransactionService,
    AuditService,
    // ✅ TransactionDiscoveryService escanea y envuelve métodos @Transactional()
    TransactionDiscoveryService,
  ],
  exports: [TransactionService, AuditService, ClsModule],
})
export class DatabaseModule {}

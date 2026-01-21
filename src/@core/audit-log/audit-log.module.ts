import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuditLogEntity } from './entities/audit-log.entity'
import { AuditLogRepository } from './repositories/audit-log.repository'
import { GranularAuditSubscriber } from './subscribers/granular-audit.subscriber'
import { GetAuditHistoryUseCase } from './use-cases'

/**
 * Audit Log Module
 *
 * Módulo de auditoría granular para Templates y Standards
 *
 * Características:
 * - Subscriber automático que detecta cambios en Template/Standard
 * - Guarda snapshots del usuario y cambios campo por campo
 * - Repositorio optimizado para consultas por template (rootId)
 * - Use cases para obtener historial completo
 *
 * IMPORTANTE:
 * 1. Este módulo debe ser importado en AppModule
 * 2. GranularAuditSubscriber se registra en providers para inyección de dependencias
 * 3. El subscriber se auto-registra en DataSource mediante dataSource.subscribers.push(this)
 */
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  providers: [
    // Repository
    AuditLogRepository,

    // 💉 Subscriber registrado como provider para inyección de dependencias
    // TypeORM lo instanciará automáticamente, pero NestJS inyectará AuditService
    GranularAuditSubscriber,

    // Use Cases
    GetAuditHistoryUseCase,
  ],
  exports: [
    // Exportar repositorio para otros módulos si es necesario
    AuditLogRepository,

    // Exportar use case para controllers
    GetAuditHistoryUseCase,
  ],
})
export class AuditLogModule {}

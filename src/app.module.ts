import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { EmailModule } from '@core/email/email.module'
import { DatabaseModule } from '@core/database'
import { SecurityModule } from '@core/security'
import { HttpModule } from '@core/http/http.module'
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core'
import { LoggerModule } from '@core/logger'
import { HttpExceptionFilter } from '@core/filters'
import {
  LoggingInterceptor,
  AuditInterceptor,
  TransformInterceptor,
} from '@core/interceptors'
import { AppConfigModule, envs } from '@core/config'
import { FilesModule } from '@core/files'
import { PersistenceModule } from '@core/persistence'
import { CacheModule } from '@core/cache'
import { CommonModule } from '@core/common/common.module'
import { UsersModule } from './modules/users/users.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'
import { AuthModule } from './modules/auth/auth.module'
import { AuthorizationModule } from './modules/authorization/authorization.module'
import { PermissionsGuard } from './modules/authorization/guards/permissions.guard'
import { TemplatesModule } from './modules/audit-library/templates/templates.module'
import { StandardsModule } from './modules/audit-library/standards/standards.module'
import { MaturityModule } from './modules/maturity/maturity.module'
// import { ImportModule } from './modules/audit-library/import/import.module' // Módulo obsoleto, funcionalidad movida a TemplatesModule
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { AuditLogModule } from './modules/audit-library/audit-log/audit-log.module'
import { NavigationModule } from './modules/navigation/navigation.module'

@Module({
  imports: [
    // Core modules (centralized configuration)
    AppConfigModule,
    // EventEmitter para emails asíncronos (en memoria, NO requiere Redis)
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    DatabaseModule,
    CacheModule, // Redis cache module
    CommonModule, // Decoradores y servicios comunes (@ConnectionInfo, ConnectionMetadataService)

    // Throttling global (protección contra DoS)
    // ✅ Migrated to use validated envs object
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: envs.security.throttleTtl, // Already in milliseconds
        limit: envs.security.throttleLimit,
      },
    ]),

    FilesModule,
    LoggerModule,
    EmailModule,
    PersistenceModule,
    AuditLogModule, // Granular audit log for Templates/Standards
    SecurityModule, // Password hashing
    HttpModule, // Cookie management

    // Authentication & Authorization
    AuthModule, // Guards: JwtAuthGuard, RolesGuard
    AuthorizationModule, // Casbin-based permissions (ABAC)

    // Feature modules
    OrganizationsModule,
    UsersModule,
    TemplatesModule, // Must be imported before StandardsModule (dependency)
    StandardsModule,
    MaturityModule,
    NavigationModule, // Navigation menu (static + dynamic)
    // ImportModule, // Template & Standards import (obsoleto - funcionalidad movida a TemplatesModule)
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // ========================================
    // Global Guards (orden de ejecución)
    // ========================================
    // 1. ThrottlerGuard (protección DoS - PRIMERO)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // 2. JwtAuthGuard (registrado en AuthModule)
    // 3. RolesGuard (registrado en AuthModule)
    // 4. PermissionsGuard (Casbin - DESPUÉS de Auth)
    /*     {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    }, */

    // ========================================
    // Global Filters
    // ========================================

    // ========================================
    // Global Interceptors (orden de ejecución)
    // ========================================
    // 1. LoggingInterceptor: Logging de requests HTTP
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // 2. AuditInterceptor: Captura usuario y lo guarda en CLS para auditoría
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    // 3. TransformInterceptor: Estandariza todas las respuestas exitosas
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}

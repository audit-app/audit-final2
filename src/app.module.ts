import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { EmailModule } from '@core/email/email.module'
import { ContextModule } from '@core/context'
import { DatabaseModule } from '@core/database'
import { SecurityModule } from '@core/security'
import { HttpModule } from '@core/http'
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core'
import { LoggerModule } from '@core/logger'
import { HttpExceptionFilter } from '@core/filters'
import {
  LoggingInterceptor,
  AuditInterceptor,
  TransformInterceptor,
} from '@core/interceptors'
import { envs } from '@core/config'
import { FilesModule } from '@core/files'
import { PersistenceModule } from '@core/database/persistence'
import { CacheModule } from '@core/cache'
import { UsersModule } from './modules/users/users.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'
import { AuthModule } from './modules/auth/auth.module'
import { AuthorizationModule } from './modules/authorization/authorization.module'
import { TemplatesModule } from './modules/audit-library/templates/templates.module'
import { StandardsModule } from './modules/audit-library/standards/standards.module'
import { MaturityModule } from './modules/maturity/maturity.module'
import { AuditsModule } from './modules/audits/audits.module'

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { AuditLogModule } from './modules/audit-library/audit-log/audit-log.module'
import { NavigationModule } from './modules/navigation/navigation.module'
import { JwtAuthGuard } from '@core/http'
import { ReportsModule } from '@core/reports/reports.module'

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    ContextModule,
    DatabaseModule,
    CacheModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: envs.security.throttleTtl,
        limit: envs.security.throttleLimit,
      },
    ]),

    FilesModule,
    LoggerModule,
    EmailModule,
    PersistenceModule,
    AuditLogModule,
    SecurityModule,
    HttpModule,
    ReportsModule,
    AuthModule,
    AuthorizationModule,

    // Feature modules
    OrganizationsModule,
    UsersModule,
    TemplatesModule,
    StandardsModule,
    MaturityModule,
    AuditsModule,
    NavigationModule,
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
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // ========================================
    // Global Filters
    // ========================================
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

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

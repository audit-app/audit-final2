import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
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
import { databaseConfig } from '@core/config'
import { FilesModule } from '@core/files'
import { PersistenceModule } from '@core/persistence'
import { CacheModule } from '@core/cache'
import { CommonModule } from '@core/common/common.module'
import { UsersModule } from './modules/users/users.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'
import { AuthModule } from './modules/auth/auth.module'
import { AuthorizationModule } from './modules/authorization/authorization.module'
import { PermissionsGuard } from './modules/authorization/guards/permissions.guard'
import { TemplatesModule } from './modules/templates/templates.module'
import { StandardsModule } from './modules/standards/standards.module'
import { MaturityModule } from './modules/maturity/maturity.module'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'

@Module({
  imports: [
    // Core modules
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig],
    }),
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
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),

    FilesModule,
    LoggerModule,
    EmailModule,
    PersistenceModule,
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

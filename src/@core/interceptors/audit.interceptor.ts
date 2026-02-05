import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { Request } from 'express'
import { AuditService, JwtPayload } from '@core/context'

/**
 * Interceptor que captura el usuario autenticado de la petición HTTP
 * y lo almacena en CLS para auditoría automática
 *
 * Extrae el usuario del contexto de la petición (añadido por JwtAuthGuard)
 * y lo guarda en CLS usando AuditService.
 *
 * Los repositorios usarán automáticamente este usuario para llenar
 * createdBy y updatedBy en las entidades.
 *
 * @example
 * ```typescript
 * // Registrar globalmente en AppModule
 * {
 *   provide: APP_INTERCEPTOR,
 *   useClass: AuditInterceptor,
 * }
 * ```
 *
 * Orden de ejecución recomendado:
 * 1. JwtAuthGuard: Valida token y añade user a request
 * 2. AuditInterceptor: Lee user de request y lo guarda en CLS
 * 3. Controller: Ejecuta lógica de negocio
 * 4. Repository: Lee user de CLS y aplica auditoría
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Solo procesar peticiones HTTP
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest<Request>()

      // El usuario es añadido por JwtAuthGuard en request.user
      // Estructura típica: { sub: 'userId', email: 'user@example.com', names, lastNames, ... }
      const user = request.user as JwtPayload

      if (user?.sub) {
        // Guardar snapshot completo del usuario para auditoría granular
        // Usamos username como fullName (names/lastNames no están en el token)
        this.auditService.setCurrentUser({
          userId: user.sub,
          fullName: user.username || 'Usuario Desconocido',
          email: user.email || 'no-email@unknown.com',
          username: user.username,
        })
      }
    }

    return next.handle()
  }
}

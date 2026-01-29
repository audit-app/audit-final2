import { Global, Module } from '@nestjs/common'
import { ClsModule } from 'nestjs-cls'
import { AuditService } from './audit.service'

/**
 * ContextModule - Módulo global para manejo de contexto con CLS
 *
 * Este módulo proporciona infraestructura de CLS (Continuation Local Storage)
 * que permite almacenar y recuperar información del contexto de ejecución actual
 * sin tener que pasarla explícitamente como parámetros.
 *
 * Usos principales:
 * - Auditoría: Almacena información del usuario autenticado (userId, email, etc.)
 * - Transacciones: Almacena EntityManager para transacciones de base de datos
 * - Request tracking: Almacena requestId para correlación de logs
 *
 * Este módulo es la base para:
 * - @core/database (TransactionService usa CLS para transacciones)
 * - @core/interceptors (AuditInterceptor usa CLS para auditoría)
 * - Cualquier servicio que necesite contexto de request
 *
 * @example
 * ```typescript
 * // En un interceptor
 * this.auditService.setCurrentUser({ userId: '123', ... })
 *
 * // En un repositorio
 * const userId = this.auditService.getCurrentUserId()
 * ```
 */
@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true, // Monta el middleware automáticamente en todas las rutas
        generateId: true, // Genera un ID único por request
      },
    }),
  ],
  providers: [AuditService],
  exports: [AuditService, ClsModule],
})
export class ContextModule {}

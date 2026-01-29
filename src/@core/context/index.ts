/**
 * @core/context - Context management with CLS
 *
 * Este módulo proporciona infraestructura para manejo de contexto de ejecución
 * usando CLS (Continuation Local Storage) de nestjs-cls.
 *
 * Exports:
 * - ContextModule: Módulo global que configura ClsModule
 * - AuditService: Servicio para auditoría automática (createdBy/updatedBy)
 * - Role: Enum de roles del sistema
 * - JwtPayload: Interface del payload de JWT Access Token
 * - JwtRefreshPayload: Interface del payload de JWT Refresh Token
 * - CURRENT_USER_ID_KEY: Clave para almacenar userId en CLS
 * - CURRENT_USER_KEY: Clave para almacenar usuario completo en CLS
 * - AuditUser: Interface para snapshot de usuario
 */

export * from './context.module'
export * from './audit.service'
export * from './enums'
export * from './interfaces'

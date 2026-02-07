import { Injectable } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'

/**
 * Clave para almacenar el ID del usuario actual en CLS
 */
export const CURRENT_USER_ID_KEY = 'CURRENT_USER_ID'

/**
 * Clave para almacenar el usuario completo en CLS (para auditoría granular)
 */
export const CURRENT_USER_KEY = 'CURRENT_USER'

/**
 * Información del usuario para auditoría granular
 * Snapshot inmutable del usuario en el momento de la acción
 */
export interface AuditUser {
  userId: string
  fullName: string
  email: string
  username?: string
}

/**
 * Servicio centralizado de auditoria
 * Usado por:
 * - AuditInterceptor: Guarda el usuario de la petición HTTP
 * - BaseRepository: Lee el usuario para aplicar createdBy/updatedBy
 *
 * @example
 * ```typescript
 * // En un interceptor o guard
 * this.auditService.setCurrentUser(user.id)
 *
 * // En un repositorio o servicio
 * const userId = this.auditService.getCurrentUserId()
 * ```
 */
@Injectable()
export class AuditService {
  constructor(private readonly cls: ClsService) {}

  /**
   * Establece el ID del usuario actual en CLS
   *
   * @param userId - ID del usuario autenticado
   */
  setCurrentUserId(userId: string): void {
    this.cls.set(CURRENT_USER_ID_KEY, userId)
  }

  /**
   * Establece el usuario completo en CLS (para auditoría granular)
   *
   * @param user - Objeto con datos del usuario (snapshot)
   */
  setCurrentUser(user: AuditUser): void {
    this.cls.set(CURRENT_USER_KEY, user)
    this.cls.set(CURRENT_USER_ID_KEY, user.userId) // Backward compatibility
  }

  /**
   * Obtiene el usuario completo desde CLS
   *
   * @returns Datos del usuario si existe en el contexto, undefined si no
   */
  getCurrentUser(): AuditUser | undefined {
    return this.cls.get<AuditUser>(CURRENT_USER_KEY)
  }

  /**
   * Obtiene el ID del usuario actual desde CLS
   *
   * @returns userId si existe en el contexto, undefined si no
   */
  getCurrentUserId(): string | undefined {
    return this.cls.get<string>(CURRENT_USER_ID_KEY)
  }

  /**
   * Verifica si hay un usuario en el contexto actual
   *
   * @returns true si hay un usuario autenticado en el contexto
   */
  hasCurrentUser(): boolean {
    return this.getCurrentUserId() !== undefined
  }

  /**
   * Limpia el usuario del contexto actual
   * Útil para testing o casos especiales
   */
  clearCurrentUser(): void {
    this.cls.set(CURRENT_USER_ID_KEY, undefined)
  }

  /**
   * Ejecuta una operación con un usuario específico en el contexto
   * Útil para seeds, migraciones o operaciones del sistema
   *
   * @param userId - ID del usuario a usar (o 'system' para operaciones del sistema)
   * @param operation - Operación a ejecutar
   *
   * @example
   * ```typescript
   * // Ejecutar como usuario específico
   * await this.auditService.runAsUser('admin-user-id', async () => {
   *   await this.userRepository.save(newUser)
   *   // createdBy será 'admin-user-id'
   * })
   *
   * // Ejecutar como sistema
   * await this.auditService.runAsUser('system', async () => {
   *   await this.seedData()
   *   // createdBy será 'system'
   * })
   * ```
   */
  async runAsUser<T>(userId: string, operation: () => Promise<T>): Promise<T> {
    return await this.cls.run(async () => {
      this.setCurrentUserId(userId)
      return await operation()
    })
  }

  /**
   * Ejecuta una operación sin usuario (auditoría deshabilitada)
   * Útil para migraciones o scripts que no tienen contexto de usuario
   *
   * @param operation - Operación a ejecutar
   *
   * @example
   * ```typescript
   * await this.auditService.runWithoutUser(async () => {
   *   await this.migrationRepository.save(data)
   *   // createdBy y updatedBy serán null
   * })
   * ```
   */
  async runWithoutUser<T>(operation: () => Promise<T>): Promise<T> {
    return await this.cls.run(async () => {
      this.clearCurrentUser()
      return await operation()
    })
  }

  /**
   * Obtiene información de auditoría para crear una entidad
   *
   * @returns Objeto con createdBy o vacío si no hay usuario
   */
  getCreateAudit(): { createdBy?: string } {
    const userId = this.getCurrentUserId()
    return userId ? { createdBy: userId } : {}
  }

  /**
   * Obtiene información de auditoría para actualizar una entidad
   *
   * @returns Objeto con updatedBy o vacío si no hay usuario
   */
  getUpdateAudit(): { updatedBy?: string } {
    const userId = this.getCurrentUserId()
    return userId ? { updatedBy: userId } : {}
  }

  /**
   * Aplica auditoría de creación a una entidad
   * Establece createdBy si hay un usuario en el contexto
   *
   * @param entity - Entidad a auditar
   */
  applyCreateAudit<T extends { createdBy?: string }>(entity: T): void {
    const userId = this.getCurrentUserId()
    if (userId && !entity.createdBy) {
      entity.createdBy = userId
    }
  }

  /**
   * Aplica auditoría de actualización a una entidad
   * Establece updatedBy si hay un usuario en el contexto
   *
   * @param entity - Entidad a auditar
   */
  applyUpdateAudit<T extends { updatedBy?: string }>(entity: T): void {
    const userId = this.getCurrentUserId()
    if (userId) {
      entity.updatedBy = userId
    }
  }

  /**
   * Aplica auditoría completa (creación y actualización) a una entidad
   *
   * @param entity - Entidad a auditar
   * @param isNew - true si es una nueva entidad, false si es actualización
   */
  applyAudit<T extends { createdBy?: string; updatedBy?: string }>(
    entity: T,
    isNew: boolean,
  ): void {
    if (isNew) {
      this.applyCreateAudit(entity)
    }
    this.applyUpdateAudit(entity)
  }
}

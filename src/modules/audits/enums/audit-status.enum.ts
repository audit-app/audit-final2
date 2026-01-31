/**
 * Estados del ciclo de vida de una auditoría
 */
export enum AuditStatus {
  /**
   * Borrador - En configuración inicial
   * Se pueden editar todos los campos y asignar miembros
   */
  DRAFT = 'DRAFT',

  /**
   * En progreso - Auditoría iniciada
   * Los miembros pueden ejecutar la auditoría
   */
  IN_PROGRESS = 'IN_PROGRESS',

  /**
   * Cerrada - Auditoría finalizada
   * No se pueden hacer más cambios
   * Puede servir como base para auditorías de revisión
   */
  CLOSED = 'CLOSED',

  /**
   * Archivada - Auditoría archivada
   * Histórica, no editable
   */
  ARCHIVED = 'ARCHIVED',
}

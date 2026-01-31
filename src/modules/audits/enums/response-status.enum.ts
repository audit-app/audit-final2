/**
 * Estado de una respuesta/evaluación de auditoría
 */
export enum ResponseStatus {
  /**
   * No iniciada - Sin información capturada
   */
  NOT_STARTED = 'NOT_STARTED',

  /**
   * En progreso - Auditor trabajando en la evaluación
   */
  IN_PROGRESS = 'IN_PROGRESS',

  /**
   * Completada - Auditor finalizó, pendiente de revisión
   */
  COMPLETED = 'COMPLETED',

  /**
   * Revisada - Lead auditor aprobó la evaluación
   */
  REVIEWED = 'REVIEWED',
}

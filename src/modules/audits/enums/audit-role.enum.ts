/**
 * Roles de los miembros dentro de una auditoría
 */
export enum AuditRole {
  /**
   * Líder del equipo auditor
   * Responsable de coordinar la auditoría y el equipo
   */
  LEAD_AUDITOR = 'LEAD_AUDITOR',

  /**
   * Auditor del equipo
   * Ejecuta las evaluaciones asignadas
   */
  AUDITOR = 'AUDITOR',

  /**
   * Auditado (cliente/organización evaluada)
   * Proporciona información y evidencia
   */
  AUDITEE = 'AUDITEE',

  /**
   * Observador
   * Solo puede ver la auditoría, no puede modificar
   */
  OBSERVER = 'OBSERVER',
}

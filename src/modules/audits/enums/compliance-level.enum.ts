/**
 * Nivel de cumplimiento de un estándar en la auditoría
 */
export enum ComplianceLevel {
  /**
   * Totalmente conforme - Cumple 100% con el estándar
   */
  COMPLIANT = 'COMPLIANT',

  /**
   * Parcialmente conforme - Cumple parcialmente, requiere mejoras
   */
  PARTIAL = 'PARTIAL',

  /**
   * No conforme - No cumple con el estándar
   */
  NON_COMPLIANT = 'NON_COMPLIANT',

  /**
   * No aplicable - El estándar no aplica para esta organización
   */
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

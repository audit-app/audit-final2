export enum TemplateStatus {
  /**
   * Borrador - En edición, no disponible para usar en auditorías
   */
  DRAFT = 'draft',

  /**
   * Publicada - Lista para usar, no se puede eliminar standards ni crear solo editar
   */
  PUBLISHED = 'published',

  /**
   * Archivada - Obsoleta, no se puede usar en nuevas auditorías
   */
  ARCHIVED = 'archived',
}

/**
 * Roles del sistema
 *
 * Define los roles disponibles en la aplicación para control de acceso.
 * Este enum se usa en:
 * - Autenticación (JWT payload)
 * - Autorización (Casbin, Guards)
 * - Auditoría (tracking de acciones por rol)
 * - Navegación (menús dinámicos por rol)
 */
export enum Role {
  ADMIN = 'admin',
  GERENTE = 'gerente',
  AUDITOR = 'auditor',
  CLIENTE = 'cliente',
}

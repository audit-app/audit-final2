import { Role } from '../../users/entities/user.entity'
import { NavigationItemDto } from '../dtos'

/**
 * Configuración de navegación estática por rol
 *
 * Define los módulos y rutas que ve cada rol en el sidebar
 */

// ========================================
// RUTAS COMUNES (todos los roles)
// ========================================
const COMMON_ROUTES: NavigationItemDto[] = [
  {
    title: 'Dashboard',
    description: 'Panel de control',
    url: '/dashboard',
    icon: 'home',
    type: 'static',
    order: 1,
  },
]

// ========================================
// RUTAS ADMIN
// ========================================
const ADMIN_ROUTES: NavigationItemDto[] = [
  {
    title: 'Biblioteca de Auditoría',
    description: 'Gestión de plantillas y standards',
    url: '#',
    icon: 'book',
    type: 'static',
    order: 10,
    children: [
      {
        title: 'Plantillas',
        description: 'Ver todas las plantillas',
        url: '/templates',
        icon: 'file-text',
        type: 'static',
        order: 1,
      },
      {
        title: 'Historial de Auditoría',
        description: 'Ver cambios en plantillas',
        url: '/audit-log',
        icon: 'history',
        type: 'static',
        order: 2,
      },
    ],
  },
  {
    title: 'Administración',
    description: 'Gestión del sistema',
    url: '#',
    icon: 'settings',
    type: 'static',
    order: 20,
    children: [
      {
        title: 'Usuarios',
        url: '/admin/users',
        icon: 'users',
        type: 'static',
        order: 1,
      },
      {
        title: 'Organizaciones',
        url: '/admin/organizations',
        icon: 'building',
        type: 'static',
        order: 2,
      },
      {
        title: 'Base de Datos',
        url: '/admin/database',
        icon: 'database',
        type: 'static',
        order: 3,
      },
    ],
  },
  {
    title: 'Auditorías',
    description: 'Gestión de auditorías',
    url: '/audits',
    icon: 'clipboard',
    type: 'static',
    order: 30,
  },
  {
    title: 'Reportes',
    description: 'Reportes y estadísticas',
    url: '/reports',
    icon: 'bar-chart',
    type: 'static',
    order: 40,
  },
]

// ========================================
// RUTAS GERENTE
// ========================================
const GERENTE_ROUTES: NavigationItemDto[] = [
  {
    title: 'Mi Organización',
    description: 'Gestión de la organización',
    url: '/organization',
    icon: 'building',
    type: 'static',
    order: 10,
  },
  {
    title: 'Equipo',
    description: 'Gestión de usuarios',
    url: '/team',
    icon: 'users',
    type: 'static',
    order: 20,
  },
  {
    title: 'Auditorías',
    description: 'Auditorías de la organización',
    url: '/audits',
    icon: 'clipboard',
    type: 'static',
    order: 30,
  },
  {
    title: 'Plantillas',
    description: 'Plantillas disponibles',
    url: '/templates',
    icon: 'file-text',
    type: 'static',
    order: 25,
  },
]

// ========================================
// RUTAS AUDITOR
// ========================================
const AUDITOR_ROUTES: NavigationItemDto[] = [
  {
    title: 'Mis Auditorías',
    description: 'Auditorías asignadas',
    url: '/audits/assigned',
    icon: 'clipboard',
    type: 'static',
    order: 10,
  },
  {
    title: 'Plantillas',
    description: 'Plantillas disponibles',
    url: '/templates',
    icon: 'file-text',
    type: 'static',
    order: 20,
  },
  {
    title: 'Evaluaciones',
    description: 'Realizar evaluaciones',
    url: '/evaluations',
    icon: 'check-square',
    type: 'static',
    order: 30,
  },
]

// ========================================
// RUTAS CLIENTE
// ========================================
const CLIENTE_ROUTES: NavigationItemDto[] = [
  {
    title: 'Mis Auditorías',
    description: 'Auditorías en las que participo',
    url: '/audits/my',
    icon: 'clipboard',
    type: 'static',
    order: 10,
  },
  {
    title: 'Reportes',
    description: 'Ver reportes de auditoría',
    url: '/reports',
    icon: 'bar-chart',
    type: 'static',
    order: 20,
  },
]

// ========================================
// MAPEO DE RUTAS POR ROL
// ========================================
export const NAVIGATION_BY_ROLE: Record<Role, NavigationItemDto[]> = {
  [Role.ADMIN]: [...COMMON_ROUTES, ...ADMIN_ROUTES],
  [Role.GERENTE]: [...COMMON_ROUTES, ...GERENTE_ROUTES],
  [Role.AUDITOR]: [...COMMON_ROUTES, ...AUDITOR_ROUTES],
  [Role.CLIENTE]: [...COMMON_ROUTES, ...CLIENTE_ROUTES],
}

/**
 * Obtiene las rutas de navegación estáticas para un rol específico
 * Las rutas se ordenan automáticamente por el campo `order`
 *
 * @param role - Rol del usuario
 * @returns Array de items de navegación ordenados
 */
export function getStaticNavigationForRole(
  role: Role,
): NavigationItemDto[] {
  const routes = NAVIGATION_BY_ROLE[role] || COMMON_ROUTES

  // Ordenar rutas por el campo order
  return routes
    .map((route) => ({
      ...route,
      children: route.children?.sort((a, b) => (a.order || 0) - (b.order || 0)),
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
}

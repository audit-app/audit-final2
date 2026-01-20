import { Role } from '../../../modules/users/entities/user.entity'
import { NavigationItemDto } from '../dtos/navigation-item.dto'

/**
 * Configuración de navegación (sidebar) por rol
 *
 * Define las rutas accesibles para cada rol del sistema
 * Las rutas se ordenan según el campo `order`
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
    order: 1,
  },
  {
    title: 'Mi Perfil',
    description: 'Información personal',
    url: '/profile',
    icon: 'user',
    order: 99,
  },
]

// ========================================
// RUTAS POR ROL
// ========================================

const ADMIN_ROUTES: NavigationItemDto[] = [
  {
    title: 'Administración',
    description: 'Gestión del sistema',
    url: '#',
    icon: 'settings',
    order: 10,
    children: [
      {
        title: 'Usuarios',
        url: '/admin/users',
        icon: 'users',
        order: 1,
      },
      {
        title: 'Organizaciones',
        url: '/admin/organizations',
        icon: 'building',
        order: 2,
      },
      {
        title: 'Roles y Permisos',
        url: '/admin/permissions',
        icon: 'shield',
        order: 3,
      },
    ],
  },
  {
    title: 'Plantillas',
    description: 'Gestión de plantillas de auditoría',
    url: '/templates',
    icon: 'file-text',
    order: 20,
  },
  {
    title: 'Madurez',
    description: 'Marcos de madurez (COBIT, CMMI)',
    url: '/maturity',
    icon: 'trending-up',
    order: 30,
  },
  {
    title: 'Auditorías',
    description: 'Gestión de auditorías',
    url: '/audits',
    icon: 'clipboard',
    order: 40,
  },
  {
    title: 'Reportes',
    description: 'Reportes y estadísticas',
    url: '/reports',
    icon: 'bar-chart',
    order: 50,
  },
]

const GERENTE_ROUTES: NavigationItemDto[] = [
  {
    title: 'Mi Organización',
    description: 'Gestión de la organización',
    url: '/organization',
    icon: 'building',
    order: 10,
  },
  {
    title: 'Equipo',
    description: 'Gestión de usuarios',
    url: '/team',
    icon: 'users',
    order: 20,
  },
  {
    title: 'Auditorías',
    description: 'Auditorías de la organización',
    url: '/audits',
    icon: 'clipboard',
    order: 30,
  },
  {
    title: 'Reportes',
    description: 'Reportes de auditorías',
    url: '/reports',
    icon: 'bar-chart',
    order: 40,
  },
]

const AUDITOR_ROUTES: NavigationItemDto[] = [
  {
    title: 'Mis Auditorías',
    description: 'Auditorías asignadas',
    url: '/audits/assigned',
    icon: 'clipboard',
    order: 10,
  },
  {
    title: 'Plantillas',
    description: 'Plantillas disponibles',
    url: '/templates',
    icon: 'file-text',
    order: 20,
  },
  {
    title: 'Evaluaciones',
    description: 'Realizar evaluaciones',
    url: '/evaluations',
    icon: 'check-square',
    order: 30,
  },
]

const CLIENTE_ROUTES: NavigationItemDto[] = [
  {
    title: 'Mis Auditorías',
    description: 'Auditorías en las que participo',
    url: '/audits/my',
    icon: 'clipboard',
    order: 10,
  },
  {
    title: 'Reportes',
    description: 'Ver reportes de auditoría',
    url: '/reports',
    icon: 'bar-chart',
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
 * Obtiene las rutas de navegación para un rol específico
 * Las rutas se ordenan automáticamente por el campo `order`
 *
 * @param role - Rol del usuario
 * @returns Array de items de navegación ordenados
 */
export function getNavigationForRole(role: Role): NavigationItemDto[] {
  const routes = NAVIGATION_BY_ROLE[role] || COMMON_ROUTES

  // Ordenar rutas por el campo order
  return routes
    .map((route) => ({
      ...route,
      children: route.children?.sort((a, b) => (a.order || 0) - (b.order || 0)),
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
}

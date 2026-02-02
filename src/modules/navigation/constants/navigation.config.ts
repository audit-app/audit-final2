import { Role } from '@core'
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
    title: 'Home',
    description: 'Página principal',
    url: '/admin',
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
    title: 'Organizaciones',
    description: 'Gestión de Organizaciones',
    url: '/admin/organizations',
    icon: 'folder',
    type: 'static',
    order: 10,
  },
  {
    title: 'Usuarios',
    description: 'Gestión de usuarios del sistema',
    url: '/admin/users',
    icon: 'users',
    type: 'static',
    order: 20,
  },
  {
    title: 'Frameworks',
    description: 'Frameworks de madurez (COBIT, CMMI)',
    url: '/admin/frameworks',
    icon: 'layers',
    type: 'static',
    order: 30,
  },
  {
    title: 'Plantillas',
    description: 'Gestión de plantillas de auditoría',
    url: '/admin/templates',
    icon: 'folder',
    type: 'static',
    order: 40,
  },
  {
    title: 'Controles',
    description: 'Controles y estándares por plantilla',
    url: '/admin/standards',
    icon: 'files',
    type: 'static',
    order: 50,
  },
]

// ========================================
// RUTAS GERENTE
// ========================================
const GERENTE_ROUTES: NavigationItemDto[] = [
  {
    title: 'Frameworks',
    description: 'Ver frameworks de madurez',
    url: '/frameworks',
    icon: 'layers',
    type: 'static',
    order: 10,
  },
  {
    title: 'Plantillas',
    description: 'Plantillas disponibles',
    url: '/templates',
    icon: 'folder',
    type: 'static',
    order: 20,
  },
  {
    title: 'Controles',
    description: 'Ver controles y estándares',
    url: '/standards',
    icon: 'files',
    type: 'static',
    order: 30,
    // Las plantillas dinámicas se insertarán aquí
  },
]

// ========================================
// RUTAS AUDITOR
// ========================================
const AUDITOR_ROUTES: NavigationItemDto[] = [
  {
    title: 'Frameworks',
    description: 'Ver frameworks de madurez',
    url: '/frameworks',
    icon: 'layers',
    type: 'static',
    order: 10,
  },
  {
    title: 'Plantillas',
    description: 'Plantillas disponibles',
    url: '/templates',
    icon: 'folder',
    type: 'static',
    order: 20,
  },
  {
    title: 'Controles',
    description: 'Ver controles y estándares',
    url: '/standards',
    icon: 'files',
    type: 'static',
    order: 30,
    // Las plantillas dinámicas se insertarán aquí
  },
]

// ========================================
// RUTAS CLIENTE
// ========================================
const CLIENTE_ROUTES: NavigationItemDto[] = [
  {
    title: 'Frameworks',
    description: 'Ver frameworks de madurez',
    url: '/frameworks',
    icon: 'layers',
    type: 'static',
    order: 10,
  },
  {
    title: 'Plantillas',
    description: 'Plantillas disponibles',
    url: '/templates',
    icon: 'folder',
    type: 'static',
    order: 20,
  },
  {
    title: 'Controles',
    description: 'Ver controles y estándares',
    url: '/standards',
    icon: 'files',
    type: 'static',
    order: 30,
    // Las plantillas dinámicas se insertarán aquí
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
export function getStaticNavigationForRole(role: Role): NavigationItemDto[] {
  const routes = NAVIGATION_BY_ROLE[role] || COMMON_ROUTES

  // Ordenar rutas por el campo order
  return routes
    .map((route) => {
      const sortedItems = route.items?.sort(
        (a, b) => (a.order || 0) - (b.order || 0),
      )

      return {
        ...route,
        items: sortedItems,
      }
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0))
}

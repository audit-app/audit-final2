# Sistema de Navegación Dinámico

Sistema de navegación (sidebar) basado en roles que retorna rutas personalizadas según los permisos del usuario.

## 📋 Tabla de Contenidos

- [Cómo Funciona](#cómo-funciona)
- [Endpoint GET /auth/me](#endpoint-get-authme)
- [Estructura de las Rutas](#estructura-de-las-rutas)
- [Configuración de Rutas por Rol](#configuración-de-rutas-por-rol)
- [Personalización](#personalización)
- [Ejemplos de Respuesta](#ejemplos-de-respuesta)

## Cómo Funciona

1. **Usuario se autentica** → Recibe JWT con sus roles
2. **Frontend llama GET /auth/me** → Backend analiza los roles
3. **NavigationService filtra rutas** → Según configuración por rol
4. **Frontend recibe rutas** → Renderiza sidebar dinámicamente

## Endpoint GET /auth/me

### Request

```http
GET /auth/me
Authorization: Bearer <access_token>
```

### Response

```json
{
  "id": "uuid",
  "names": "Juan",
  "lastNames": "Pérez",
  "email": "admin@example.com",
  "username": "admin",
  "roles": ["admin"],
  "isActive": true,
  "organization": {
    "id": "uuid",
    "name": "Mi Empresa"
  },
  "navigation": [
    {
      "title": "Dashboard",
      "description": "Panel de control",
      "url": "/dashboard",
      "icon": "home",
      "order": 1
    },
    {
      "title": "Administración",
      "description": "Gestión del sistema",
      "url": "#",
      "icon": "settings",
      "order": 10,
      "children": [
        {
          "title": "Usuarios",
          "url": "/admin/users",
          "icon": "users",
          "order": 1
        },
        {
          "title": "Organizaciones",
          "url": "/admin/organizations",
          "icon": "building",
          "order": 2
        }
      ]
    }
  ]
}
```

## Estructura de las Rutas

Cada ruta tiene la siguiente estructura:

```typescript
interface NavigationItemDto {
  title: string              // Título del menú
  description?: string       // Descripción opcional
  url: string               // URL de la ruta
  icon?: string             // Nombre del icono (de tu librería de iconos)
  children?: NavigationItemDto[]  // Sub-menús
  badge?: string            // Contador (ej: "5" para notificaciones)
  badgeVariant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  disabled?: boolean        // Si está deshabilitado
  order?: number           // Orden de visualización
}
```

## Configuración de Rutas por Rol

Las rutas están configuradas en `src/modules/auth/shared/config/navigation.config.ts`:

### Roles Disponibles

- **ADMIN** - Administrador del sistema (acceso completo)
- **GERENTE** - Gerente de organización
- **AUDITOR** - Auditor de procesos
- **CLIENTE** - Cliente externo (acceso limitado)

### Rutas Comunes (todos los roles)

```typescript
- Dashboard
- Mi Perfil
```

### Rutas por Rol

#### ADMIN

```typescript
- Dashboard
- Administración
  - Usuarios
  - Organizaciones
  - Roles y Permisos
- Plantillas
- Madurez (COBIT, CMMI)
- Auditorías
- Reportes
- Mi Perfil
```

#### GERENTE

```typescript
- Dashboard
- Mi Organización
- Equipo
- Auditorías
- Reportes
- Mi Perfil
```

#### AUDITOR

```typescript
- Dashboard
- Mis Auditorías
- Plantillas
- Evaluaciones
- Mi Perfil
```

#### CLIENTE

```typescript
- Dashboard
- Mis Auditorías
- Reportes
- Mi Perfil
```

## Personalización

### Agregar Nueva Ruta

Edita `src/modules/auth/shared/config/navigation.config.ts`:

```typescript
const ADMIN_ROUTES: NavigationItemDto[] = [
  // ... rutas existentes
  {
    title: 'Nueva Sección',
    description: 'Descripción de la sección',
    url: '/new-section',
    icon: 'star',
    order: 60,
  },
]
```

### Crear Menú Multinivel

```typescript
{
  title: 'Configuración',
  url: '#',
  icon: 'settings',
  order: 50,
  children: [
    {
      title: 'General',
      url: '/settings/general',
      icon: 'cog',
      order: 1,
    },
    {
      title: 'Seguridad',
      url: '/settings/security',
      icon: 'shield',
      order: 2,
      children: [
        {
          title: 'Contraseña',
          url: '/settings/security/password',
          order: 1,
        },
        {
          title: '2FA',
          url: '/settings/security/2fa',
          order: 2,
        },
      ],
    },
  ],
}
```

### Agregar Badge/Contador

```typescript
{
  title: 'Notificaciones',
  url: '/notifications',
  icon: 'bell',
  badge: '5',
  badgeVariant: 'danger',
  order: 90,
}
```

## Múltiples Roles

Si un usuario tiene múltiples roles, el sistema:
1. Combina las rutas de todos sus roles
2. Elimina duplicados por URL
3. Ordena por el campo `order`

Ejemplo: Usuario con roles `['admin', 'auditor']` verá:
- Todas las rutas de ADMIN
- Rutas únicas de AUDITOR que no estén en ADMIN

## Integración con Casbin (Futuro)

El `NavigationService` tiene un método preparado para integrarse con Casbin:

```typescript
async filterByPermissions(
  routes: NavigationItemDto[],
  userId: string,
): Promise<NavigationItemDto[]>
```

Esto permitirá filtrar rutas según permisos granulares de Casbin en el futuro.

## Ejemplos de Respuesta

### Usuario ADMIN

```json
{
  "navigation": [
    {
      "title": "Dashboard",
      "url": "/dashboard",
      "icon": "home",
      "order": 1
    },
    {
      "title": "Administración",
      "url": "#",
      "icon": "settings",
      "order": 10,
      "children": [
        { "title": "Usuarios", "url": "/admin/users", "icon": "users", "order": 1 },
        { "title": "Organizaciones", "url": "/admin/organizations", "icon": "building", "order": 2 }
      ]
    }
  ]
}
```

### Usuario CLIENTE

```json
{
  "navigation": [
    {
      "title": "Dashboard",
      "url": "/dashboard",
      "icon": "home",
      "order": 1
    },
    {
      "title": "Mis Auditorías",
      "url": "/audits/my",
      "icon": "clipboard",
      "order": 10
    },
    {
      "title": "Reportes",
      "url": "/reports",
      "icon": "bar-chart",
      "order": 20
    },
    {
      "title": "Mi Perfil",
      "url": "/profile",
      "icon": "user",
      "order": 99
    }
  ]
}
```

## Testing

### Probar con cURL

```bash
# 1. Hacer login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail": "admin@example.com", "password": "password"}'

# 2. Obtener navegación
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <access_token>"
```

### Probar en Swagger

1. Abrir http://localhost:3000/api
2. Ir a `/auth/login` → Ejecutar con credenciales
3. Copiar `accessToken`
4. Click en "Authorize" (arriba a la derecha)
5. Pegar token
6. Ir a `/auth/me` → Ejecutar
7. Ver respuesta con navegación

## Archivos Creados

```
src/modules/auth/shared/
├── config/
│   └── navigation.config.ts          # Configuración de rutas por rol
├── dtos/
│   ├── index.ts
│   └── navigation-item.dto.ts        # DTO de item de navegación
└── services/
    ├── index.ts
    └── navigation.service.ts         # Servicio de navegación

src/modules/auth/login/dtos/
└── me-response.dto.ts                # DTO de respuesta /me con navegación
```

## Notas Importantes

1. **Las rutas se ordenan automáticamente** por el campo `order`
2. **Los iconos** son nombres genéricos - ajústalos según tu librería de iconos (FontAwesome, Material Icons, etc.)
3. **Las URLs** son ejemplos - ajústalas según tu routing del frontend
4. **Rutas deshabilitadas** se pueden marcar con `disabled: true` (útil para features en desarrollo)

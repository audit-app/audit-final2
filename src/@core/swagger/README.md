# Swagger Decorators - Guía de Uso

Este módulo proporciona decoradores reutilizables para documentar endpoints de forma consistente y mantenible, evitando repetición de código.

## 🚀 Decoradores Recomendados (NUEVOS)

**Usa estos decoradores compuestos para el 95% de tus endpoints:**

```typescript
import {
  ApiCreate,      // POST - Crear recursos
  ApiList,        // GET - Listar con paginación
  ApiFindOne,     // GET /:id - Obtener por ID
  ApiUpdate,      // PATCH /:id - Actualizar
  ApiRemove,      // DELETE /:id - Eliminar
  ApiCustom,      // Operaciones personalizadas
} from '@core/swagger'
```

**Ver [BEST_PRACTICES.md](./BEST_PRACTICES.md) para la guía completa de uso profesional.**

---

## Decoradores Disponibles

### Decoradores Base

#### `@ApiStandardResponses(options?)`
Aplica las respuestas estándar comunes a todos los endpoints (400, 401, 403, 500).

```typescript
@ApiStandardResponses()
async myEndpoint() {}

// Excluir algunas respuestas (ej: endpoints públicos)
@ApiStandardResponses({ exclude: [401, 403] })
async publicEndpoint() {}
```

#### `@ApiOkResponse(type, description?, isArray?)`
Respuesta exitosa para GET (200).

```typescript
// Un solo recurso
@ApiOkResponse(UserResponseDto, 'Usuario encontrado')
async findOne() {}

// Array de recursos (sin paginación)
@ApiOkResponse(UserResponseDto, 'Usuarios encontrados', true)
async findSome() {}
```

#### `@ApiCreatedResponse(type, description?)`
Respuesta exitosa para POST (201).

```typescript
@ApiCreatedResponse(UserResponseDto, 'Usuario creado exitosamente')
async create() {}
```

#### `@ApiUpdatedResponse(type, description?)`
Respuesta exitosa para PUT/PATCH (200).

```typescript
@ApiUpdatedResponse(UserResponseDto)
async update() {}
```

#### `@ApiDeletedResponse(description?, noContent?)`
Respuesta exitosa para DELETE (200 o 204).

**⚠️ Nota:** En esta aplicación, **preferimos siempre retornar datos (200)** en DELETE para que el frontend pueda confirmar la operación. Solo usar 204 en casos excepcionales.

```typescript
// ✅ Recomendado: Con contenido (200)
@ApiOkResponse(UserResponseDto, 'Usuario eliminado exitosamente')
async remove() {}

// ❌ No recomendado: Sin contenido (204)
@ApiDeletedResponse('Usuario eliminado', true)
async hardDelete() {}
```

#### `@ApiConflictResponse(description)`
Respuesta de conflicto (409).

```typescript
@ApiConflictResponse('Ya existe un usuario con ese email')
async create() {}
```

#### `@ApiNotFoundResponse(description?)`
Respuesta de recurso no encontrado (404).

```typescript
@ApiNotFoundResponse('Usuario no encontrado')
async findOne() {}
```

### Decoradores Compuestos (CRUD)

Estos decoradores combinan múltiples respuestas típicas de operaciones CRUD.

#### `@ApiCreateResponses(type, conflictDescription?)`
Para endpoints POST que crean recursos.

**Incluye:** 201, 400, 401, 403, 409, 500

```typescript
@Post()
@ApiOperation({ summary: 'Crear usuario' })
@ApiCreateResponses(UserResponseDto, 'Email ya existe')
async create(@Body() dto: CreateUserDto) {}
```

#### `@ApiReadResponses(type, isArray?)`
Para endpoints GET que leen recursos (sin paginación).

**Incluye:** 200, 400, 401, 403, 500

```typescript
@Get()
@ApiOperation({ summary: 'Listar usuarios' })
@ApiReadResponses(UserResponseDto, true)
async findAll() {}
```

#### `@ApiPaginatedResponse(type, description?)`
Respuesta paginada genérica (200) con metadatos.

```typescript
@ApiPaginatedResponse(UserResponseDto)
async findAll() {}
```

#### `@ApiPaginatedResponses(type)`
Para endpoints GET que retornan resultados paginados.

**Incluye:** 200 (paginada), 400, 401, 403, 500

```typescript
@Get()
@ApiOperation({ summary: 'Listar usuarios con paginación' })
@ApiPaginatedResponses(UserResponseDto)
async findAll(@Query() query: FindUsersDto) {}
```

**Estructura de respuesta:**
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### `@ApiUpdateResponses(type, includeConflict?)`
Para endpoints PUT/PATCH que actualizan recursos.

**Incluye:** 200, 400, 401, 403, 404, 500 (+ 409 si includeConflict=true)

```typescript
@Patch(':id')
@ApiOperation({ summary: 'Actualizar usuario' })
@ApiUpdateResponses(UserResponseDto)
async update(@Param() { id }: UuidParamDto, @Body() dto: UpdateUserDto) {}

// Con posible conflicto (ej: email duplicado)
@ApiUpdateResponses(UserResponseDto, true)
async update() {}
```

#### `@ApiDeleteResponses(noContent?)`
Para endpoints DELETE.

**Incluye:** 200/204, 401, 403, 404, 500

```typescript
@Delete(':id')
@ApiOperation({ summary: 'Eliminar usuario' })
@ApiDeleteResponses(true)
async remove(@Param() { id }: UuidParamDto) {}
```

## DTOs de Respuesta

Cada módulo debe tener un DTO de respuesta que defina la estructura de datos que retorna el endpoint.

### Ejemplo de DTO de Respuesta

```typescript
import { ApiProperty } from '@nestjs/swagger'

export class UserResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único del usuario',
  })
  id: string

  @ApiProperty({ example: 'Juan Pérez' })
  fullName: string

  @ApiProperty({
    example: 'juan@example.com',
    description: 'Correo electrónico del usuario',
  })
  email: string

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    required: false,
    nullable: true,
  })
  imageUrl: string | null

  @ApiProperty({ example: '2024-01-20T10:30:00Z' })
  createdAt: string
}
```

## Patrón de Uso Completo

### Controlador Típico CRUD

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import {
  ApiCreateResponses,
  ApiPaginatedResponses,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiStandardResponses,
  ApiUpdateResponses,
  ApiDeleteResponses,
} from '@core/swagger'
import { UuidParamDto } from '@core/dtos'

@ApiTags('users')
@Controller('users')
export class UsersController {
  // CREATE
  @Post()
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiCreateResponses(UserResponseDto, 'Email ya existe')
  async create(@Body() dto: CreateUserDto) {}

  // READ ALL (paginado)
  @Get()
  @ApiOperation({ summary: 'Listar usuarios con paginación' })
  @ApiPaginatedResponses(UserResponseDto)
  async findAll(@Query() query: FindUsersDto) {}

  // READ ONE
  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiOkResponse(UserResponseDto, 'Usuario encontrado')
  @ApiNotFoundResponse('Usuario no encontrado')
  @ApiStandardResponses()
  async findOne(@Param() { id }: UuidParamDto) {}

  // UPDATE
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiUpdateResponses(UserResponseDto, true)
  async update(
    @Param() { id }: UuidParamDto,
    @Body() dto: UpdateUserDto,
  ) {}

  // DELETE (retorna el recurso eliminado)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiOkResponse(UserResponseDto, 'Usuario eliminado exitosamente')
  @ApiNotFoundResponse('Usuario no encontrado')
  @ApiStandardResponses()
  async remove(@Param() { id }: UuidParamDto) {
    return await this.removeUserUseCase.execute(id)
  }
}
```

## Helper para Operaciones Paginadas

Para endpoints GET con paginación, usa el helper `buildPaginatedOperation` que genera automáticamente la descripción a partir de metadatos del DTO:

```typescript
import {
  buildPaginatedOperation,
  ApiPaginatedResponses,
} from '@core/swagger'
import {
  FindUsersDto,
  USER_SORTABLE_FIELDS,
  USER_SEARCH_FIELDS,
} from '../dtos/find-users.dto'

@Get()
@ApiOperation(
  buildPaginatedOperation({
    summary: 'Listar todos los usuarios',
    searchFields: USER_SEARCH_FIELDS,
    sortableFields: USER_SORTABLE_FIELDS.map(String),
    defaultSortBy: 'createdAt',
    filterFields: [
      {
        name: 'status',
        description: 'Filtrar por estado del usuario',
        type: `enum: ${Object.values(UserStatus).join(', ')}`,
      },
      {
        name: 'role',
        description: 'Filtrar por rol',
        type: `enum: ${Object.values(Role).join(', ')}`,
      },
      {
        name: 'organizationId',
        description: 'Filtrar por ID de organización',
        type: 'UUID',
      },
    ],
  }),
)
@ApiPaginatedResponses(UserResponseDto)
async findAll(@Query() dto: FindUsersDto) {}
```

**Ventajas:**
- ✅ Genera automáticamente la documentación de paginación
- ✅ Extrae campos sortables del DTO
- ✅ Documenta filtros personalizados
- ✅ Si cambias el DTO, solo actualizas las constantes

**Constantes requeridas en el DTO:**
```typescript
// find-users.dto.ts
export const USER_SORTABLE_FIELDS: (keyof UserEntity)[] = [
  'lastNames', 'email', 'createdAt', 'organizationId',
]

export const USER_SEARCH_FIELDS = [
  'names', 'lastNames', 'email', 'username', 'ci',
]
```

## Buenas Prácticas

1. **Siempre usar DTOs de respuesta** en lugar de entidades para documentar endpoints
2. **Usar decoradores compuestos** (ApiCreateResponses, ApiUpdateResponses, etc.) cuando sea posible
3. **Usar `buildPaginatedOperation`** para endpoints GET con paginación - evita duplicación
4. **Exportar constantes de filtrado** (SORTABLE_FIELDS, SEARCH_FIELDS) en el DTO para reutilizarlas
5. **Ser específico** en los mensajes de error (ej: "Email ya existe" en lugar de "Conflicto")
6. **Usar `UuidParamDto`** de `@core/dtos` para validar parámetros UUID
7. **DELETE siempre debe retornar datos (200)** - El frontend necesita confirmar qué se eliminó y actualizar la UI. Usar `@ApiOkResponse` + retornar el recurso eliminado en lugar de `HttpStatus.NO_CONTENT` (204)

## Ventajas de este Enfoque

- **Mantenible:** Cambios en respuestas estándar se aplican automáticamente
- **Consistente:** Todos los endpoints retornan las mismas estructuras de error
- **Conciso:** Menos líneas de código por controlador
- **Tipado:** TypeScript valida los tipos de los DTOs
- **Documentación clara:** Swagger UI muestra todas las respuestas posibles

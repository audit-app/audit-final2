# Mejores Prácticas Profesionales para Swagger/OpenAPI

## Filosofía: Convention over Configuration

El enfoque profesional para documentar APIs es **minimizar el código repetitivo** y **maximizar la reutilización**. Este documento explica cómo documentar endpoints Swagger de forma profesional con el **mínimo código posible**.

---

## ❌ Antes (Forma NO Profesional)

### Ejemplo de endpoint con mucho código repetitivo:

```typescript
@Post()
@HttpCode(HttpStatus.CREATED)
@ApiOperation({
  summary: 'Crear un nuevo usuario',
  description: 'Crea un nuevo usuario con sus datos básicos...',
})
@ApiResponse({
  status: 201,
  description: 'Usuario creado exitosamente',
  type: UserResponseDto,
})
@ApiResponse({
  status: 400,
  description: 'Datos de entrada inválidos',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 400 },
      message: { type: 'array', items: { type: 'string' } },
      error: { type: 'string', example: 'Bad Request' },
    },
  },
})
@ApiResponse({
  status: 401,
  description: 'No autenticado',
  schema: { /* ... */ },
})
@ApiResponse({
  status: 403,
  description: 'Sin permisos',
  schema: { /* ... */ },
})
@ApiResponse({
  status: 409,
  description: 'Ya existe un usuario con ese email',
  schema: { /* ... */ },
})
@ApiResponse({
  status: 500,
  description: 'Error interno del servidor',
  schema: { /* ... */ },
})
async create(@Body() dto: CreateUserDto) {
  return await this.service.create(dto)
}
```

**Problemas:**
- ❌ **40+ líneas** de decoradores Swagger
- ❌ Código repetitivo en cada endpoint
- ❌ Difícil de mantener
- ❌ Propenso a errores e inconsistencias
- ❌ Violación del principio DRY (Don't Repeat Yourself)

---

## ✅ Ahora (Forma Profesional)

### Mismo endpoint con decoradores compuestos:

```typescript
@Post()
@ApiCreate(UserResponseDto, {
  summary: 'Crear un nuevo usuario',
  description: 'Crea un nuevo usuario con sus datos básicos...',
  conflictMessage: 'Ya existe un usuario con ese email',
})
async create(@Body() dto: CreateUserDto) {
  return await this.service.create(dto)
}
```

**Beneficios:**
- ✅ **7 líneas** en lugar de 40+ líneas
- ✅ Un solo decorador incluye TODO
- ✅ Fácil de leer y mantener
- ✅ Consistencia garantizada
- ✅ Sigue principio DRY

---

## Decoradores Disponibles

### 1. `@ApiCreate` - Endpoint POST (Create)

```typescript
@Post()
@ApiCreate(UserResponseDto, {
  summary: 'Crear usuario',                          // Opcional
  description: 'Descripción detallada...',           // Opcional
  conflictMessage: 'Email ya existe',                // Opcional
})
async create(@Body() dto: CreateUserDto) {}
```

**Incluye automáticamente:**
- ✅ `@HttpCode(201)`
- ✅ `@ApiOperation` con summary y description
- ✅ `@ApiCreatedResponse(201)` con el DTO
- ✅ `@ApiConflictResponse(409)` con mensaje personalizado
- ✅ Respuestas estándar (400, 401, 403, 500)

---

### 2. `@ApiList` - Endpoint GET con paginación

```typescript
@Get()
@ApiList(UserResponseDto, {
  summary: 'Listar usuarios',                       // Opcional (se genera automático)
  searchFields: USER_SEARCH_FIELDS,                 // Del DTO
  sortableFields: USER_SORTABLE_FIELDS,             // Del DTO
  defaultSortBy: 'createdAt',                       // Default
  filterFields: [                                   // Filtros personalizados
    {
      name: 'status',
      description: 'Filtrar por estado',
      type: 'enum: active, inactive, suspended',
    },
  ],
})
async findAll(@Query() dto: FindUsersDto) {}
```

**Incluye automáticamente:**
- ✅ `@ApiOperation` con descripción completa de paginación
- ✅ `@ApiPaginatedResponse(200)` con estructura de respuesta paginada
- ✅ Respuestas estándar (400, 401, 403, 500)
- ✅ Documentación de todos los parámetros de paginación

---

### 3. `@ApiFindOne` - Endpoint GET /:id

```typescript
@Get(':id')
@ApiFindOne(UserResponseDto)
async findOne(@Param() { id }: UuidParamDto) {}
```

**Incluye automáticamente:**
- ✅ `@ApiOperation` con summary y description generados
- ✅ `@ApiOkResponse(200)` con el DTO
- ✅ `@ApiNotFoundResponse(404)`
- ✅ Respuestas estándar (400, 401, 403, 500)

**Aún más corto:**
```typescript
@Get(':id')
@ApiFindOne(UserResponseDto, {
  summary: 'Buscar usuario por ID',                 // Sobrescribir si necesitas
})
async findOne(@Param() { id }: UuidParamDto) {}
```

---

### 4. `@ApiUpdate` - Endpoint PATCH /:id

```typescript
@Patch(':id')
@ApiUpdate(UserResponseDto, {
  conflictMessage: 'Email ya existe',               // Opcional
})
async update(
  @Param() { id }: UuidParamDto,
  @Body() dto: UpdateUserDto,
) {}
```

**Incluye automáticamente:**
- ✅ `@ApiOperation` con summary y description generados
- ✅ `@ApiUpdatedResponse(200)` con el DTO
- ✅ `@ApiNotFoundResponse(404)`
- ✅ `@ApiConflictResponse(409)` si se proporciona mensaje
- ✅ Respuestas estándar (400, 401, 403, 500)

---

### 5. `@ApiRemove` - Endpoint DELETE /:id

```typescript
@Delete(':id')
@ApiRemove(UserResponseDto, {
  summary: 'Eliminar usuario (soft delete)',        // Opcional
  conflictMessage: 'No se puede eliminar',          // Opcional
})
async remove(@Param() { id }: UuidParamDto) {}
```

**Incluye automáticamente:**
- ✅ `@HttpCode(200)` - Retorna el recurso eliminado
- ✅ `@ApiOperation` con summary y description generados
- ✅ `@ApiOkResponse(200)` con el DTO
- ✅ `@ApiNotFoundResponse(404)`
- ✅ `@ApiConflictResponse(409)` si se proporciona mensaje
- ✅ Respuestas estándar (400, 401, 403, 500)

---

### 6. `@ApiCustom` - Endpoints personalizados

Para operaciones que no son CRUD estándar (activate, deactivate, etc.):

```typescript
@Patch(':id/activate')
@ApiCustom(UserResponseDto, {
  summary: 'Activar usuario',
  description: 'Cambia el estado del usuario a ACTIVE',
  notFound: true,                                   // Include 404? (default: true)
  conflict: 'Usuario ya está activo',               // Opcional
})
async activate(@Param() { id }: UuidParamDto) {}
```

**Incluye automáticamente:**
- ✅ `@HttpCode(200)`
- ✅ `@ApiOperation` con summary y description
- ✅ `@ApiOkResponse(200)` con el DTO
- ✅ `@ApiNotFoundResponse(404)` si `notFound !== false`
- ✅ `@ApiConflictResponse(409)` si se proporciona mensaje
- ✅ Respuestas estándar (400, 401, 403, 500)

---

## Comparación Completa: Controlador CRUD

### ❌ ANTES (Forma tradicional - 120+ líneas)

```typescript
@Controller('users')
export class UsersController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear usuario', description: '...' })
  @ApiResponse({ status: 201, description: '...', type: UserResponseDto })
  @ApiResponse({ status: 400, description: '...', schema: { ... } })
  @ApiResponse({ status: 401, description: '...', schema: { ... } })
  @ApiResponse({ status: 403, description: '...', schema: { ... } })
  @ApiResponse({ status: 409, description: '...', schema: { ... } })
  @ApiResponse({ status: 500, description: '...', schema: { ... } })
  async create(@Body() dto: CreateUserDto) { ... }

  @Get()
  @ApiOperation({ summary: '...', description: `
    Obtiene una lista paginada...
    **Parámetros de paginación:**
    - page: ...
    - limit: ...
    ... 20 líneas más ...
  `})
  @ApiResponse({ status: 200, description: '...', schema: { ... } })
  @ApiResponse({ status: 400, description: '...', schema: { ... } })
  @ApiResponse({ status: 401, description: '...', schema: { ... } })
  @ApiResponse({ status: 403, description: '...', schema: { ... } })
  @ApiResponse({ status: 500, description: '...', schema: { ... } })
  async findAll(@Query() dto: FindUsersDto) { ... }

  @Get(':id')
  @ApiOperation({ summary: '...', description: '...' })
  @ApiResponse({ status: 200, description: '...', type: UserResponseDto })
  @ApiResponse({ status: 404, description: '...', schema: { ... } })
  @ApiResponse({ status: 400, description: '...', schema: { ... } })
  @ApiResponse({ status: 401, description: '...', schema: { ... } })
  @ApiResponse({ status: 403, description: '...', schema: { ... } })
  @ApiResponse({ status: 500, description: '...', schema: { ... } })
  async findOne(@Param() { id }: UuidParamDto) { ... }

  // ... 30+ líneas más por cada endpoint
}
```

---

### ✅ AHORA (Forma profesional - 30 líneas)

```typescript
@Controller('users')
export class UsersController {
  @Post()
  @ApiCreate(UserResponseDto, {
    conflictMessage: 'Email ya existe',
  })
  async create(@Body() dto: CreateUserDto) { ... }

  @Get()
  @ApiList(UserResponseDto, {
    searchFields: USER_SEARCH_FIELDS,
    sortableFields: USER_SORTABLE_FIELDS,
    filterFields: [
      { name: 'status', description: 'Filtrar por estado', type: 'enum: ...' },
    ],
  })
  async findAll(@Query() dto: FindUsersDto) { ... }

  @Get(':id')
  @ApiFindOne(UserResponseDto)
  async findOne(@Param() { id }: UuidParamDto) { ... }

  @Patch(':id')
  @ApiUpdate(UserResponseDto, {
    conflictMessage: 'Email ya existe',
  })
  async update(@Param() { id }: UuidParamDto, @Body() dto: UpdateUserDto) { ... }

  @Delete(':id')
  @ApiRemove(UserResponseDto)
  async remove(@Param() { id }: UuidParamDto) { ... }
}
```

**Reducción: de 120+ líneas a 30 líneas (75% menos código!)**

---

## Reglas de Oro

### 1. **Siempre usar decoradores compuestos**

```typescript
// ❌ MAL
@Get(':id')
@ApiOperation({ summary: 'Obtener usuario' })
@ApiResponse({ status: 200, type: UserResponseDto })
@ApiResponse({ status: 404, description: 'No encontrado' })
// ... 5 decoradores más

// ✅ BIEN
@Get(':id')
@ApiFindOne(UserResponseDto)
```

### 2. **Solo personalizar lo necesario**

```typescript
// ❌ INNECESARIO - El summary se genera automáticamente
@Get(':id')
@ApiFindOne(UserResponseDto, {
  summary: 'Obtener usuario por ID',
  description: 'Retorna los datos de un usuario...',
})

// ✅ MEJOR - Dejar que se genere automáticamente
@Get(':id')
@ApiFindOne(UserResponseDto)
```

### 3. **Exportar constantes en DTOs**

```typescript
// find-users.dto.ts
export const USER_SEARCH_FIELDS = ['names', 'lastNames', 'email']
export const USER_SORTABLE_FIELDS: (keyof UserEntity)[] = ['createdAt', 'email']

export class FindUsersDto extends PaginationDto {
  // ... campos
}
```

### 4. **Un decorador por tipo de operación**

| Operación | Método HTTP | Decorador | Uso |
|-----------|------------|-----------|-----|
| Create | POST | `@ApiCreate` | Crear recursos |
| List | GET | `@ApiList` | Listar con paginación |
| FindOne | GET /:id | `@ApiFindOne` | Obtener por ID |
| Update | PATCH /:id | `@ApiUpdate` | Actualizar recursos |
| Remove | DELETE /:id | `@ApiRemove` | Eliminar (soft delete) |
| Custom | ANY | `@ApiCustom` | Operaciones personalizadas |

---

## Ventajas del Enfoque Profesional

### 1. **Mantenibilidad** 📦
- Cambios en respuestas estándar se aplican automáticamente
- Un solo lugar para actualizar documentación

### 2. **Consistencia** 🎯
- Todos los endpoints retornan las mismas estructuras de error
- Documentación uniforme en toda la API

### 3. **Productividad** ⚡
- 75% menos código Swagger
- Más tiempo para lógica de negocio

### 4. **Legibilidad** 📖
- Controladores limpios y fáciles de leer
- Intención clara de cada endpoint

### 5. **DRY (Don't Repeat Yourself)** ♻️
- Zero repetición de código
- Configuración centralizada

---

## Casos de Uso Avanzados

### Endpoints con File Upload

```typescript
@Post(':id/upload-avatar')
@UploadAvatar({ maxSize: 2 * 1024 * 1024 })
@ApiCustom(UserResponseDto, {
  summary: 'Subir avatar de usuario',
  description: 'Sube o reemplaza el avatar del usuario. Formatos: JPG, PNG, WebP. Tamaño máximo: 2MB.',
})
async uploadAvatar(
  @Param() { id }: UuidParamDto,
  @UploadedFile() file: Express.Multer.File,
) {}
```

### Endpoints Públicos (sin autenticación)

El decorador ya maneja esto automáticamente eliminando respuestas 401/403:

```typescript
@Public()
@Post()
@ApiCreate(UserResponseDto)  // No incluirá 401/403 porque @Public() lo indica
async create(@Body() dto: CreateUserDto) {}
```

---

## Resumen

**Forma NO Profesional:**
- Muchas líneas de código
- Repetición
- Difícil de mantener
- Inconsistencias

**Forma Profesional:**
- Código minimalista
- DRY (Don't Repeat Yourself)
- Fácil mantenimiento
- Consistencia garantizada

**Usa siempre decoradores compuestos (`@ApiCreate`, `@ApiList`, etc.) y solo personaliza lo estrictamente necesario.**

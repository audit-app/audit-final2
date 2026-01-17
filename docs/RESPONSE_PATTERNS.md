# Patrones de Respuesta HTTP

Guía para estandarizar las respuestas HTTP en los controllers de la aplicación.

## Tabla de Contenidos

- [⚡ Respuestas Automáticas con TransformInterceptor (RECOMENDADO)](#-respuestas-automáticas-con-transforminterceptor-recomendado)
- [Introducción](#introducción)
- [Mejores Prácticas REST](#mejores-prácticas-rest)
- [Opciones Disponibles](#opciones-disponibles)
- [Decoradores Swagger](#decoradores-swagger)
- [BaseController (Opcional)](#basecontroller-opcional)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Migración de Controllers Existentes](#migración-de-controllers-existentes)

---

## ⚡ Respuestas Automáticas con TransformInterceptor (RECOMENDADO)

**NOVEDAD:** Este proyecto utiliza `TransformInterceptor` para estandarizar TODAS las respuestas automáticamente. No necesitas heredar de `BaseController` ni devolver objetos manualmente.

### Cómo Funciona

El interceptor envuelve **todas las respuestas exitosas** en esta estructura:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operación exitosa",
  "data": { ... },
  "timestamp": "2024-01-17T10:30:00.000Z"
}
```

### Mensajes Automáticos por Método HTTP

El interceptor detecta automáticamente el método HTTP y genera mensajes inteligentes:

| Método HTTP | Mensaje Automático |
|-------------|-------------------|
| `POST` | "Registro creado correctamente" |
| `PATCH` / `PUT` | "Actualización exitosa" |
| `DELETE` | "Eliminación exitosa" |
| `GET` | "Operación exitosa" |

### Uso Básico (Sin Decoradores)

```typescript
@Controller('users')
export class UsersController {
  @Post()
  async create(@Body() dto: CreateUserDto) {
    return await this.service.create(dto)
    // Respuesta automática:
    // {
    //   "success": true,
    //   "statusCode": 201,
    //   "message": "Registro creado correctamente",
    //   "data": { id: "...", name: "..." },
    //   "timestamp": "2024-01-17T..."
    // }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    await this.service.update(id, dto)
    // NO necesitas devolver nada!
    // Respuesta automática:
    // {
    //   "success": true,
    //   "statusCode": 200,
    //   "message": "Actualización exitosa",
    //   "data": null,
    //   "timestamp": "2024-01-17T..."
    // }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(id)
    // Respuesta automática:
    // {
    //   "success": true,
    //   "statusCode": 200,
    //   "message": "Eliminación exitosa",
    //   "data": null,
    //   "timestamp": "2024-01-17T..."
    // }
  }
}
```

### Mensajes Personalizados con `@ResponseMessage()`

Si quieres personalizar el mensaje, usa el decorador `@ResponseMessage()`:

```typescript
import { ResponseMessage } from '@core/decorators'

@Controller('users')
export class UsersController {
  @Post()
  @ResponseMessage('Usuario creado exitosamente')
  async create(@Body() dto: CreateUserDto) {
    return await this.service.create(dto)
    // {
    //   "success": true,
    //   "message": "Usuario creado exitosamente", ← Mensaje personalizado
    //   "data": { id: "...", name: "..." }
    // }
  }

  @Patch(':id/activate')
  @ResponseMessage('Usuario activado correctamente')
  async activate(@Param('id') id: string) {
    await this.service.activate(id)
    // {
    //   "success": true,
    //   "message": "Usuario activado correctamente",
    //   "data": null
    // }
  }
}
```

### ¿Qué pasa con los datos?

El interceptor **respeta los datos** que devuelves:

- Si devuelves datos → los incluye en `data`
- Si no devuelves nada → `data` será `null`
- **NUNCA** reemplaza ni borra tus datos

```typescript
// Ejemplo 1: Devolver datos
@Get(':id')
async findOne(@Param('id') id: string) {
  return await this.service.findById(id)
  // data: { id: "...", name: "..." } ✅
}

// Ejemplo 2: No devolver datos (void)
@Patch(':id')
async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  await this.service.update(id, dto)
  // data: null ✅
}

// Ejemplo 3: Devolver ID
@Post()
async create(@Body() dto: CreateUserDto) {
  const user = await this.service.create(dto)
  return { id: user.id }
  // data: { id: "..." } ✅ (NO reemplaza, envuelve)
}
```

### Manejo Inteligente de Paginación

El interceptor **detecta automáticamente** respuestas paginadas y **aplana la estructura** para evitar `data.data`.

**Estructura de respuesta paginada esperada:**
```typescript
{
  data: [...],    // Array de registros
  meta: {         // Metadata de paginación
    total: 100,
    page: 1,
    limit: 10,
    totalPages: 10,
    hasNextPage: true,
    hasPrevPage: false
  }
}
```

**Ejemplo de controller con paginación:**
```typescript
@Controller('users')
export class UsersController {
  @Get()
  async findAll(@Query() query: PaginationDto) {
    // Service devuelve: { data: [...users], meta: {...} }
    return await this.service.findAll(query)
  }
}
```

**❌ ANTES (sin interceptor inteligente):**
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "data": [...],    ← ¡Doble "data"!
    "meta": {...}
  }
}
```

**✅ DESPUÉS (con interceptor inteligente):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operación exitosa",
  "data": [...],     ← Array directo (aplanado)
  "meta": {          ← Meta al mismo nivel que data
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2024-01-17T10:30:00.000Z"
}
```

**¿Cómo detecta la paginación?**

El interceptor verifica que la respuesta tenga:
- Campo `data` (que sea un array)
- Campo `meta` (que sea un objeto)

Si cumple ambas condiciones, **automáticamente aplana** la estructura.

### Ventajas del TransformInterceptor

✅ **Automático**: No necesitas heredar de BaseController
✅ **Consistente**: Todas las respuestas tienen el mismo formato
✅ **Mensajes inteligentes**: Detecta el método HTTP automáticamente
✅ **Personalizable**: Usa `@ResponseMessage()` cuando necesites
✅ **Respeta tus datos**: Solo envuelve, nunca reemplaza
✅ **No afecta errores**: Solo transforma respuestas exitosas (2xx)

### Comparación: Antes vs Después

**❌ ANTES (Manual con BaseController):**
```typescript
@Controller('users')
export class UsersController extends BaseController {
  constructor() {
    super() // Requerido
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    await this.service.update(id, dto)
    return this.sendUpdated('Usuario') // Manual
  }
}
```

**✅ DESPUÉS (Automático con TransformInterceptor):**
```typescript
@Controller('users')
export class UsersController {
  @Patch(':id')
  @ResponseMessage('Usuario actualizado') // Opcional
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    await this.service.update(id, dto)
    // ¡Listo! No necesitas devolver nada
  }
}
```

---

## Introducción

Este proyecto utiliza **TransformInterceptor** para estandarizar automáticamente las respuestas. Además, soporta **3 patrones de respuesta** para casos especiales:

1. **Devolver la entidad completa** (recomendado para frontends modernos)
2. **Devolver mensaje genérico** (más ligero, menos datos)
3. **204 No Content** (estándar REST puro, sin cuerpo de respuesta)

Todos los patrones son válidos y tienen sus casos de uso. Elige el que mejor se adapte a tus necesidades.

---

## Mejores Prácticas REST

### POST (Create)
- **Status Code:** `201 Created`
- **Respuesta:** Devolver la entidad creada completa ✅
- **Headers (opcional):** `Location: /api/resource/{id}`

```typescript
@Post()
@ApiCreate(UserResponseDto)
async create(@Body() dto: CreateUserDto) {
  return await this.createUseCase.execute(dto)
  // Status: 201, Body: { id: "...", name: "...", ... }
}
```

### GET (Read)
- **Status Code:** `200 OK`
- **Respuesta:** Devolver la entidad o lista de entidades

```typescript
@Get(':id')
@ApiFindOne(UserResponseDto)
async findOne(@Param('id') id: string) {
  return await this.findByIdUseCase.execute(id)
  // Status: 200, Body: { id: "...", name: "...", ... }
}
```

### PATCH/PUT (Update)

#### Opción 1: Devolver entidad actualizada (RECOMENDADO)
```typescript
@Patch(':id')
@ApiUpdate(UserResponseDto)
async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  return await this.updateUseCase.execute(id, dto)
  // Status: 200, Body: { id: "...", name: "...", ... }
}
```

#### Opción 2: Devolver mensaje genérico
```typescript
@Patch(':id')
@ApiUpdateWithMessage({ summary: 'Actualizar usuario' })
async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  await this.updateUseCase.execute(id, dto)
  return this.sendUpdated('Usuario')
  // Status: 200, Body: { message: "Usuario actualizado exitosamente", timestamp: "..." }
}
```

### DELETE (Remove)

#### Opción 1: Devolver entidad eliminada (útil para soft delete)
```typescript
@Delete(':id')
@ApiRemove(UserResponseDto)
async remove(@Param('id') id: string) {
  return await this.removeUseCase.execute(id)
  // Status: 200, Body: { id: "...", name: "...", deletedAt: "..." }
}
```

#### Opción 2: Devolver mensaje genérico
```typescript
@Delete(':id')
@ApiRemoveWithMessage({ summary: 'Eliminar usuario' })
async remove(@Param('id') id: string) {
  await this.removeUseCase.execute(id)
  return this.sendDeleted('Usuario')
  // Status: 200, Body: { message: "Usuario eliminado exitosamente", timestamp: "..." }
}
```

#### Opción 3: 204 No Content (REST puro)
```typescript
@Delete(':id')
@ApiRemoveNoContent({ summary: 'Eliminar usuario' })
async remove(@Param('id') id: string) {
  await this.removeUseCase.execute(id)
  // No devolver nada
  // Status: 204, Body: (vacío)
}
```

---

## Opciones Disponibles

### ¿Cuál opción elegir?

| Patrón | Ventajas | Desventajas | Caso de Uso |
|--------|----------|-------------|-------------|
| **Devolver entidad** | • El frontend obtiene datos actualizados sin request adicional<br>• Útil para mostrar cambios inmediatamente<br>• Estándar en APIs modernas (GitHub, Stripe, etc.) | • Más bytes transferidos<br>• Puede incluir datos innecesarios | **Recomendado para:**<br>• Frontends SPA/React<br>• Cuando necesitas mostrar datos actualizados<br>• Auditoría/logs |
| **Mensaje genérico** | • Respuesta ligera<br>• Menos datos transferidos<br>• Suficiente para confirmación | • Frontend necesita hacer GET adicional si necesita datos<br>• No muestra qué cambió | **Recomendado para:**<br>• APIs públicas con rate limiting<br>• Operaciones batch<br>• Frontends que no necesitan datos |
| **204 No Content** | • Respuesta vacía (0 bytes)<br>• Estándar REST puro<br>• Muy eficiente | • No devuelve confirmación visual<br>• Frontend debe asumir éxito | **Recomendado para:**<br>• APIs de alto rendimiento<br>• Operaciones simples<br>• Clientes que solo necesitan status code |

---

## Decoradores Swagger

El proyecto incluye decoradores Swagger para cada patrón de respuesta.

### Decoradores Disponibles

| Decorador | Descripción | Retorna |
|-----------|-------------|---------|
| `@ApiCreate(Dto)` | POST - Crear recurso | Entidad creada (201) |
| `@ApiList(Dto, options)` | GET - Listar con paginación | Lista paginada (200) |
| `@ApiFindOne(Dto)` | GET /:id - Obtener por ID | Entidad (200) |
| `@ApiUpdate(Dto)` | PATCH /:id - Actualizar | Entidad actualizada (200) |
| `@ApiUpdateWithMessage(options)` | PATCH /:id - Actualizar | Mensaje genérico (200) |
| `@ApiRemove(Dto)` | DELETE /:id - Eliminar | Entidad eliminada (200) |
| `@ApiRemoveWithMessage(options)` | DELETE /:id - Eliminar | Mensaje genérico (200) |
| `@ApiRemoveNoContent(options)` | DELETE /:id - Eliminar | Sin contenido (204) |
| `@ApiCustom(Dto, options)` | Endpoints personalizados | Entidad (200) |

### Importar Decoradores

```typescript
import {
  ApiCreate,
  ApiFindOne,
  ApiUpdate,
  ApiUpdateWithMessage,
  ApiRemove,
  ApiRemoveWithMessage,
  ApiRemoveNoContent,
} from '@core/swagger'
```

---

## BaseController (Opcional)

**NOTA:** Con `TransformInterceptor`, **NO necesitas usar BaseController**. Esta sección se mantiene por compatibilidad con código existente.

El `BaseController` proporciona métodos helper para generar respuestas estandarizadas manualmente.

### Cómo Usar

```typescript
import { BaseController } from '@core/controllers'

@Controller('users')
export class UsersController extends BaseController {
  constructor(
    // ... tus dependencias
  ) {
    super() // ⚠️ IMPORTANTE: Llamar super()
  }
}
```

### Métodos Disponibles

| Método | Retorna | Ejemplo |
|--------|---------|---------|
| `sendSuccess(message)` | Mensaje personalizado | `this.sendSuccess('Operación exitosa')` |
| `sendCreated(resource)` | Mensaje de creación | `this.sendCreated('Usuario')` |
| `sendUpdated(resource)` | Mensaje de actualización | `this.sendUpdated('Usuario')` |
| `sendDeleted(resource)` | Mensaje de eliminación | `this.sendDeleted('Usuario')` |
| `sendActivated(resource)` | Mensaje de activación | `this.sendActivated('Usuario')` |
| `sendDeactivated(resource)` | Mensaje de desactivación | `this.sendDeactivated('Usuario')` |

Todos los métodos devuelven un objeto `SuccessResponseDto`:

```json
{
  "message": "Usuario actualizado exitosamente",
  "timestamp": "2024-01-17T10:30:00.000Z"
}
```

---

## Ejemplos de Uso

### Ejemplo 1: CRUD Completo con Entidades

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { ApiCreate, ApiFindOne, ApiUpdate, ApiRemove } from '@core/swagger'
import { UuidParamDto } from '@core/dtos'

@Controller('users')
export class UsersController {
  @Post()
  @ApiCreate(UserResponseDto)
  async create(@Body() dto: CreateUserDto) {
    return await this.createUseCase.execute(dto)
    // { id: "...", name: "...", email: "...", createdAt: "..." }
  }

  @Get(':id')
  @ApiFindOne(UserResponseDto)
  async findOne(@Param() { id }: UuidParamDto) {
    return await this.findByIdUseCase.execute(id)
    // { id: "...", name: "...", email: "...", ... }
  }

  @Patch(':id')
  @ApiUpdate(UserResponseDto)
  async update(@Param() { id }: UuidParamDto, @Body() dto: UpdateUserDto) {
    return await this.updateUseCase.execute(id, dto)
    // { id: "...", name: "UPDATED", email: "...", updatedAt: "..." }
  }

  @Delete(':id')
  @ApiRemove(UserResponseDto)
  async remove(@Param() { id }: UuidParamDto) {
    return await this.removeUseCase.execute(id)
    // { id: "...", name: "...", deletedAt: "..." }
  }
}
```

### Ejemplo 2: CRUD con Mensajes Genéricos

```typescript
import { Controller, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { ApiCreate, ApiUpdateWithMessage, ApiRemoveWithMessage } from '@core/swagger'
import { BaseController } from '@core/controllers'

@Controller('users')
export class UsersController extends BaseController {
  constructor(/* ... dependencias */) {
    super()
  }

  @Post()
  @ApiCreate(UserResponseDto)
  async create(@Body() dto: CreateUserDto) {
    return await this.createUseCase.execute(dto)
    // POST sigue devolviendo la entidad completa
  }

  @Patch(':id')
  @ApiUpdateWithMessage({ summary: 'Actualizar usuario' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    await this.updateUseCase.execute(id, dto)
    return this.sendUpdated('Usuario')
    // { message: "Usuario actualizado exitosamente", timestamp: "..." }
  }

  @Delete(':id')
  @ApiRemoveWithMessage({ summary: 'Eliminar usuario' })
  async remove(@Param('id') id: string) {
    await this.removeUseCase.execute(id)
    return this.sendDeleted('Usuario')
    // { message: "Usuario eliminado exitosamente", timestamp: "..." }
  }
}
```

### Ejemplo 3: DELETE con 204 No Content

```typescript
import { Controller, Delete, Param } from '@nestjs/common'
import { ApiRemoveNoContent } from '@core/swagger'

@Controller('users')
export class UsersController {
  @Delete(':id')
  @ApiRemoveNoContent({ summary: 'Eliminar usuario' })
  async remove(@Param('id') id: string) {
    await this.removeUseCase.execute(id)
    // No devolver nada - NestJS envía automáticamente status 204
  }
}
```

### Ejemplo 4: Endpoints Personalizados

```typescript
import { Controller, Patch, Param } from '@nestjs/common'
import { ApiUpdateWithMessage } from '@core/swagger'
import { BaseController } from '@core/controllers'

@Controller('users')
export class UsersController extends BaseController {
  constructor(/* ... */) {
    super()
  }

  @Patch(':id/activate')
  @ApiUpdateWithMessage({ summary: 'Activar usuario' })
  async activate(@Param('id') id: string) {
    await this.activateUseCase.execute(id)
    return this.sendActivated('Usuario')
    // { message: "Usuario activado exitosamente", timestamp: "..." }
  }

  @Patch(':id/deactivate')
  @ApiUpdateWithMessage({ summary: 'Desactivar usuario' })
  async deactivate(@Param('id') id: string) {
    await this.deactivateUseCase.execute(id)
    return this.sendDeactivated('Usuario')
    // { message: "Usuario desactivado exitosamente", timestamp: "..." }
  }

  @Patch(':id/reset-password')
  @ApiUpdateWithMessage({ summary: 'Resetear contraseña' })
  async resetPassword(@Param('id') id: string) {
    await this.resetPasswordUseCase.execute(id)
    return this.sendSuccess('Contraseña reseteada, revisa tu email')
    // { message: "Contraseña reseteada, revisa tu email", timestamp: "..." }
  }
}
```

---

## Migración de Controllers Existentes

Si tienes controllers existentes que devuelven entidades y quieres cambiarlos a mensajes genéricos:

### Paso 1: Extender de BaseController

```typescript
// ANTES
@Controller('users')
export class UsersController {
  constructor(/* ... */) {}
}

// DESPUÉS
import { BaseController } from '@core/controllers'

@Controller('users')
export class UsersController extends BaseController {
  constructor(/* ... */) {
    super() // ⚠️ Importante: llamar super()
  }
}
```

### Paso 2: Cambiar Decoradores

```typescript
// ANTES
@Patch(':id')
@ApiUpdate(UserResponseDto)
async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  return await this.updateUseCase.execute(id, dto)
}

// DESPUÉS
@Patch(':id')
@ApiUpdateWithMessage({ summary: 'Actualizar usuario' })
async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  await this.updateUseCase.execute(id, dto)
  return this.sendUpdated('Usuario')
}
```

### Paso 3: Actualizar Imports

```typescript
// ANTES
import { ApiUpdate, ApiRemove } from '@core/swagger'

// DESPUÉS
import { ApiUpdateWithMessage, ApiRemoveWithMessage } from '@core/swagger'
```

---

## DTOs de Respuesta

### SuccessResponseDto

```typescript
{
  "message": "Operación exitosa",
  "timestamp": "2024-01-17T10:30:00.000Z"
}
```

### Clases Disponibles

```typescript
import {
  SuccessResponseDto,
  UpdatedResponseDto,
  DeletedResponseDto,
  ActivatedResponseDto,
  DeactivatedResponseDto,
} from '@core/dtos'
```

Todas heredan de `SuccessResponseDto` y generan mensajes automáticamente:

```typescript
new UpdatedResponseDto('Usuario')
// { message: "Usuario actualizado exitosamente", timestamp: "..." }

new DeletedResponseDto('Organización')
// { message: "Organización eliminado exitosamente", timestamp: "..." }

new SuccessResponseDto('Mensaje personalizado')
// { message: "Mensaje personalizado", timestamp: "..." }
```

---

## Resumen

| Escenario | Decorador | Helper | Retorna |
|-----------|-----------|--------|---------|
| Crear recurso | `@ApiCreate(Dto)` | - | Entidad completa |
| Actualizar (con entidad) | `@ApiUpdate(Dto)` | - | Entidad actualizada |
| Actualizar (con mensaje) | `@ApiUpdateWithMessage()` | `sendUpdated('Recurso')` | Mensaje genérico |
| Eliminar (con entidad) | `@ApiRemove(Dto)` | - | Entidad eliminada |
| Eliminar (con mensaje) | `@ApiRemoveWithMessage()` | `sendDeleted('Recurso')` | Mensaje genérico |
| Eliminar (sin contenido) | `@ApiRemoveNoContent()` | - | Vacío (204) |
| Activar | `@ApiUpdateWithMessage()` | `sendActivated('Recurso')` | Mensaje genérico |
| Desactivar | `@ApiUpdateWithMessage()` | `sendDeactivated('Recurso')` | Mensaje genérico |

---

## Referencias

- [REST API Best Practices (Microsoft)](https://docs.microsoft.com/en-us/azure/architecture/best-practices/api-design)
- [HTTP Status Codes (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Richardson Maturity Model](https://martinfowler.com/articles/richardsonMaturityModel.html)

# Audit Core - Sistema de Gestión de Auditorías

Sistema backend completo para gestión de auditorías con soporte para plantillas, estándares, frameworks de madurez (COBIT 5, CMMI) y flujos de evaluación.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#-requisitos-previos)
- [Instalación Rápida](#-instalación-rápida)
- [Configuración del Entorno](#-configuración-del-entorno)
- [Base de Datos](#-base-de-datos)
- [Ejecutar la Aplicación](#-ejecutar-la-aplicación)
- [Comandos Disponibles](#-comandos-disponibles)
- [Documentación API](#-documentación-api)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Seguridad](#-seguridad)
- [Testing](#-testing)
- [Solución de Problemas](#-solución-de-problemas)

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.x (recomendado: 20.x LTS)
- **npm** >= 9.x
- **PostgreSQL** >= 14.x
- **Redis** >= 6.x
- **Docker & Docker Compose** (opcional, pero recomendado)

### Verificar versiones instaladas

```bash
node --version    # v20.x.x
npm --version     # 9.x.x
psql --version    # PostgreSQL 14.x
redis-cli --version  # redis-cli 6.x.x
```

## 🚀 Instalación Rápida

### Opción 1: Con Docker (Recomendado)

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd final-audit2

# 2. Instalar dependencias
npm install

# 3. Copiar archivo de ejemplo de variables de entorno
cp .env.example .env

# 4. Generar secrets seguros (ver sección de configuración)
# Edita el archivo .env con tus valores

# 5. Levantar PostgreSQL y Redis con Docker
docker-compose up -d

# 6. Configurar la base de datos
npm run db:setup

# 7. Iniciar la aplicación
npm run dev
```

### Opción 2: Sin Docker (PostgreSQL y Redis locales)

```bash
# 1-4. Igual que la opción con Docker

# 5. Crear la base de datos manualmente
createdb audit_core_db

# 6. Iniciar Redis
redis-server

# 7. Configurar la base de datos
npm run db:setup

# 8. Iniciar la aplicación
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

## ⚙️ Configuración del Entorno

### 1. Crear archivo .env

```bash
cp .env.example .env
```

### 2. Generar Secrets Seguros

**IMPORTANTE:** Nunca uses los valores de ejemplo en producción. Genera tus propios secrets:

```bash
# Generar secrets aleatorios (32+ caracteres)
openssl rand -base64 32

# Generar uno para cada variable:
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - TWO_FACTOR_JWT_SECRET
# - EMAIL_VERIFICATION_JWT_SECRET
# - SESSION_SECRET
# - DEVICE_FINGERPRINT_SALT (mínimo 16 caracteres)
```

### 3. Variables de Entorno Esenciales

#### Base de Datos

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/audit_core_db
```

#### Redis

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

#### JWT (REQUERIDO - Generar con openssl)

```env
JWT_SECRET=<tu-secret-generado-aqui>
JWT_REFRESH_SECRET=<tu-secret-generado-aqui>
```

#### Email (Desarrollo - Usar Ethereal)

```env
MAIL_HOST=smtp.ethereal.email
MAIL_PORT=587
MAIL_USER=<usuario-ethereal>
MAIL_PASSWORD=<password-ethereal>
```

Para obtener credenciales de Ethereal:

```bash
npm run email:test:setup
```

#### Email (Producción - Gmail ejemplo)

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password  # Contraseña de aplicación de Google
```

[Cómo obtener App Password de Gmail](https://support.google.com/accounts/answer/185833)

### 4. Variables Opcionales

#### Google OAuth (Dejar vacío si no se usa)

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

#### Frontend URLs

```env
FRONTEND_URL=http://localhost:8080
FRONTEND_VERIFY_EMAIL_URL=http://localhost:8080/verify-email
FRONTEND_RESET_PASSWORD_URL=http://localhost:8080/reset-password
```

## 🗄️ Base de Datos

### Docker (Recomendado)

```bash
# Levantar PostgreSQL y Redis
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Eliminar datos (⚠️ CUIDADO: Borra todo)
docker-compose down -v
```

### Comandos de Base de Datos

```bash
# Setup completo (crear DB, ejecutar migraciones, seed)
npm run db:setup

# Crear base de datos
npm run db:create

# Ejecutar migraciones
npm run migration:run

# Ejecutar seeds
npm run seed:run

# Reset completo (⚠️ Borra datos existentes)
npm run db:reset

# Fresh start (⚠️ Borra TODO y empieza de cero)
npm run db:fresh
```

### Migraciones

```bash
# Generar migración desde cambios en entidades
npm run migration:generate -- src/@core/database/migrations/NombreMigracion

# Crear migración vacía
npm run migration:create -- src/@core/database/migrations/NombreMigracion

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert

# Ver estado de migraciones
npm run migration:show
```

Ver más detalles en: [DATABASE_COMMANDS.md](./DATABASE_COMMANDS.md)

## 🏃 Ejecutar la Aplicación

### Desarrollo

```bash
# Modo watch (recarga automática)
npm run dev

# Con debugger
npm run debug
```

### Producción

```bash
# Compilar
npm run build

# Ejecutar
npm run prod
```

### Verificar que funciona

```bash
# La aplicación debe estar corriendo en http://localhost:3000

# Verificar health check
curl http://localhost:3000/health

# Abrir Swagger UI
# http://localhost:3000/api
```

## 📚 Comandos Disponibles

### Desarrollo

```bash
npm run dev           # Iniciar en modo desarrollo
npm run debug         # Iniciar con debugger
npm run build         # Compilar TypeScript
npm run format        # Formatear código con Prettier
npm run lint          # Lint y fix con ESLint
```

### Testing

```bash
npm test              # Tests unitarios
npm run test:watch    # Tests en modo watch
npm run test:cov      # Tests con cobertura
npm run test:e2e      # Tests end-to-end
npm run test:all      # Todos los tests
```

### Base de Datos

```bash
npm run db:setup      # Setup completo
npm run db:create     # Crear BD
npm run db:drop       # Eliminar BD (⚠️)
npm run db:reset      # Reset BD
npm run migration:run # Ejecutar migraciones
npm run seed:run      # Ejecutar seeds
```

### Email Testing

```bash
npm run email:test:setup   # Generar credenciales Ethereal
npm run email:test         # Probar todos los templates
npm run email:test:welcome # Probar email de bienvenida
npm run email:test:verify  # Probar email de verificación
npm run email:test:2fa     # Probar código 2FA
npm run email:test:reset   # Probar reset password
```

### Swagger Testing

```bash
npm run swagger:test           # Verificar todo
npm run swagger:test validate  # Validar configuración
npm run swagger:test coverage  # Ver cobertura de documentación
```

### Otros

```bash
npm run commit        # Commit con Commitizen (conventional commits)
```

## 📖 Documentación API

### Swagger UI

Una vez que la aplicación esté corriendo, accede a la documentación interactiva:

**URL:** http://localhost:3000/api

### Endpoints Principales

#### Autenticación

- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refrescar token
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Perfil del usuario

#### Two-Factor Authentication

- `POST /api/auth/2fa/verify` - Verificar código 2FA
- `POST /api/auth/2fa/resend` - Reenviar código 2FA

#### Password Reset

- `POST /api/auth/password/request-reset` - Solicitar reset
- `POST /api/auth/password/resend-reset` - Reenviar código
- `POST /api/auth/password/reset` - Resetear contraseña

#### Google OAuth

- `GET /api/auth/google` - Iniciar autenticación
- `GET /api/auth/google/callback` - Callback de Google

#### Organizaciones

- `GET /api/organizations` - Listar organizaciones
- `POST /api/organizations` - Crear organización
- `GET /api/organizations/:id` - Obtener organización
- `PATCH /api/organizations/:id` - Actualizar organización
- `DELETE /api/organizations/:id` - Eliminar organización

#### Usuarios

- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario
- `POST /api/users` - Crear usuario
- `PATCH /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

Ver documentación completa en Swagger UI.

## 🏗️ Arquitectura del Proyecto

```
src/
├── @core/                    # Infraestructura compartida
│   ├── cache/               # Redis & cache
│   ├── config/              # Configuración
│   ├── database/            # TypeORM, migraciones, seeds
│   ├── email/               # Sistema de emails
│   ├── files/               # Manejo de archivos
│   ├── filters/             # Exception filters
│   ├── http/                # HTTP utilities
│   ├── interceptors/        # Interceptors
│   ├── logger/              # Sistema de logs
│   ├── repositories/        # Base repository
│   ├── reports/             # Generación de reportes
│   ├── security/            # Seguridad (OTP, Rate Limiting)
│   └── swagger/             # Configuración Swagger
│
├── modules/                  # Módulos de negocio
│   ├── auth/                # Autenticación
│   │   ├── authentication/  # Login, 2FA, OAuth
│   │   ├── recovery/        # Password reset
│   │   └── session/         # Sesiones, dispositivos
│   ├── organizations/       # Organizaciones
│   ├── users/               # Usuarios
│   ├── audits/              # Auditorías
│   └── permissions/         # Permisos
│
├── app.module.ts            # Módulo principal
└── main.ts                  # Entry point
```

### Características de Arquitectura

- **Modular:** Cada módulo es independiente y reutilizable
- **Path Aliases:** `@core`, `@shared` para imports limpios
- **CLS:** Continuation Local Storage para transacciones y auditoría
- **Repository Pattern:** Abstracción de base de datos
- **Use Cases:** Lógica de negocio separada
- **DTOs:** Validación automática con class-validator
- **Interceptors:** Transformación automática de respuestas

## 🔒 Seguridad

### Características Implementadas

✅ **Autenticación**

- JWT con access + refresh tokens
- Two-Factor Authentication (2FA)
- Google OAuth
- Session management
- Trusted devices

✅ **Rate Limiting**

- Global throttling (100 req/min)
- Login rate limiting (5 intentos/15 min por usuario)
- Password reset rate limiting (10 intentos/hora)
- 2FA resend cooldown (60 segundos)

✅ **Tokens & Sessions**

- OTP con Redis (one-time use)
- Token burning después de 3 intentos
- Session revocation
- Automatic logout en cambio de contraseña

✅ **Seguridad de Datos**

- Bcrypt para passwords (10 rounds)
- Sanitización automática de logs
- Auditoría automática (createdBy, updatedBy)
- Soft deletes

✅ **Headers de Seguridad**

- CORS configurado
- Helmet (próximamente)
- CSRF protection (próximamente)

### Generar Secrets de Producción

```bash
# JWT Secret
openssl rand -base64 32

# Session Secret
openssl rand -base64 32

# Device Fingerprint Salt
openssl rand -base64 24

# 2FA Secret
openssl rand -base64 32

# Email Verification Secret
openssl rand -base64 32
```

**⚠️ IMPORTANTE:**

- Nunca commitear el archivo `.env`
- Usar `.env.example` como plantilla
- En producción, usar variables de entorno del sistema
- Rotar secrets periódicamente

## 🧪 Testing

```bash
# Tests unitarios
npm test

# Tests con cobertura
npm run test:cov

# Tests E2E
npm run test:e2e

# Tests en modo watch
npm run test:watch

# Todos los tests
npm run test:all
```

### Estructura de Tests

```
src/
└── module/
    ├── service.ts
    ├── service.spec.ts          # Unit tests
    ├── repository.ts
    ├── repository.spec.ts       # Repository tests
    └── controller.ts

test/
└── module.e2e-spec.ts          # E2E tests
```

## 🐛 Solución de Problemas

### La aplicación no inicia

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps
# o si es local:
pg_isready

# Verificar que Redis esté corriendo
redis-cli ping
# Debe responder: PONG

# Verificar variables de entorno
cat .env | grep DATABASE_URL
cat .env | grep JWT_SECRET
```

### Error: "JWT_SECRET is required"

```bash
# Generar un secret seguro
openssl rand -base64 32

# Agregarlo al .env
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
```

### Error de conexión a PostgreSQL

```bash
# Verificar que la BD existe
psql -U postgres -l | grep audit_core_db

# Si no existe, crearla
npm run db:create

# Verificar la URL de conexión en .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/audit_core_db
```

### Error de conexión a Redis

```bash
# Si usas Docker
docker-compose up -d redis

# Si es local
redis-server

# Verificar conexión
redis-cli ping
```

### Migraciones no se ejecutan

```bash
# Ver estado de migraciones
npm run migration:show

# Ejecutar migraciones pendientes
npm run migration:run

# Si hay conflictos, revertir
npm run migration:revert

# Fresh start (⚠️ BORRA TODO)
npm run db:fresh
```

### Emails no se envían

```bash
# Verificar configuración SMTP
npm run email:test:setup  # Genera credenciales Ethereal

# Probar envío
npm run email:test

# Revisar logs
docker-compose logs -f  # Si usas Docker
# o revisar archivos en logs/
```

### Puerto 3000 ya en uso

```bash
# Cambiar puerto en .env
PORT=3001

# O matar el proceso
lsof -ti:3000 | xargs kill -9
```

### Limpiar y empezar de cero

```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Eliminar base de datos y recrear
npm run db:fresh

# Si usas Docker
docker-compose down -v
docker-compose up -d
npm run db:setup
```

## 📝 Documentación Adicional

- [DATABASE_COMMANDS.md](./DATABASE_COMMANDS.md) - Comandos de base de datos
- [DOCKER.md](./DOCKER.md) - Guía de Docker
- [CLAUDE.md](./CLAUDE.md) - Guía para desarrollo con Claude Code
- [docs/AUDIT_SYSTEM.md](./docs/AUDIT_SYSTEM.md) - Sistema de auditoría
- [src/@core/swagger/README.md](./src/@core/swagger/README.md) - Guía de Swagger

## 🤝 Contribuir

1. Crear una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Hacer commits usando conventional commits: `npm run commit`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Crear un Pull Request

### Conventional Commits

```bash
# Usar Commitizen para commits
npm run commit

# Tipos de commit:
# feat:     Nueva funcionalidad
# fix:      Corrección de bug
# docs:     Cambios en documentación
# style:    Formato, punto y coma, etc
# refactor: Refactorización de código
# test:     Agregar/modificar tests
# chore:    Mantenimiento, deps, etc
```

## 📄 Licencia

UNLICENSED - Uso privado

## 👥 Soporte

Para reportar bugs o solicitar features, crear un issue en el repositorio.

---

**¡Listo para desarrollar!** 🚀

Si tienes problemas, revisa la sección de [Solución de Problemas](#-solución-de-problemas) o consulta la documentación adicional.

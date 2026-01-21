# Guía de Logging - Ver Requests y Responses

## 🎯 Mejoras Implementadas

El sistema de logging ahora muestra **TODA LA INFORMACIÓN** de requests y responses para facilitar el debugging.

### ✅ Lo que LLEGA (Request)
- ✅ Método HTTP (GET, POST, PUT, DELETE)
- ✅ URL completa
- ✅ **Headers** (con datos sensibles redactados)
- ✅ **Query params** (?page=1&limit=10)
- ✅ **Route params** (/users/:id)
- ✅ **Body** (datos del request)
- ✅ IP del cliente
- ✅ User agent y device info

### ✅ Lo que SALE (Response)
- ✅ Status code (200, 400, 500, etc.)
- ✅ **Response body completo** (lo que se envía al cliente)
- ✅ Tiempo de respuesta (ms)
- ✅ Emojis visuales por status:
  - ✅ 2xx (Success)
  - 🔄 3xx (Redirect)
  - ⚠️ 4xx (Client Error)
  - ❌ 5xx (Server Error)

## 📋 Formato de Logs

### Request Log (Entrada)
```
📥 Incoming Request: POST /api/auth/login
{
  "user": {
    "userId": "abc-123",
    "userEmail": "user@example.com"
  },
  "device": {
    "os": "Windows",
    "browser": "Chrome",
    "device": "Desktop"
  },
  "request": {
    "method": "POST",
    "url": "/api/auth/login",
    "ip": "192.168.1.100",
    "contentType": "application/json",
    "headers": {
      "host": "localhost:3000",
      "content-type": "application/json",
      "authorization": "[REDACTED]",  // ← Datos sensibles ocultos
      "user-agent": "Mozilla/5.0..."
    },
    "query": {},
    "params": {},
    "body": {
      "email": "user@example.com",
      "password": "***REDACTED***"  // ← Password sanitizado automáticamente
    }
  }
}
```

### Response Log (Salida)
```
✅ Outgoing Response: POST /api/auth/login 200 45ms
{
  "user": {
    "userId": "abc-123",
    "userEmail": "user@example.com"
  },
  "device": {
    "os": "Windows",
    "browser": "Chrome"
  },
  "request": {
    "method": "POST",
    "url": "/api/auth/login",
    "ip": "192.168.1.100"
  },
  "response": {
    "statusCode": 200,
    "responseTime": 45,
    "body": {
      "success": true,
      "data": {
        "accessToken": "***REDACTED***",  // ← Token sanitizado
        "user": {
          "id": "abc-123",
          "email": "user@example.com",
          "name": "John Doe"
        }
      }
    }
  }
}
```

## 🔍 Cómo Ver los Logs

### En Desarrollo (Consola)

Los logs aparecen **automáticamente en la consola** con colores:

```bash
npm run start:dev
```

**Ejemplo de salida:**
```
[http] 📥 Incoming Request: POST /api/auth/login
  {
    "request": {
      "body": { "email": "test@test.com", "password": "***REDACTED***" }
    }
  }

[http] ✅ Outgoing Response: POST /api/auth/login 200 45ms
  {
    "response": {
      "statusCode": 200,
      "body": { "success": true, "data": {...} }
    }
  }
```

### En Archivos (Producción)

Los logs se guardan automáticamente en:

```
logs/
├── http-2024-01-20.log          # Todos los logs HTTP
├── http-error-2024-01-20.log    # Solo errores
└── ...
```

**Ver logs en tiempo real:**
```bash
# Todos los logs
tail -f logs/http-$(date +%Y-%m-%d).log

# Solo errores
tail -f logs/http-error-$(date +%Y-%m-%d).log

# Con formato bonito (usando jq)
tail -f logs/http-$(date +%Y-%m-%d).log | jq
```

## 🔧 Configuración de Nivel de Log

Controla qué logs ver con `LOG_LEVEL` en `.env`:

```bash
# .env
LOG_LEVEL=debug    # Muestra TODO (desarrollo)
LOG_LEVEL=http     # Muestra HTTP + errores (staging)
LOG_LEVEL=info     # Muestra info + errores (producción)
LOG_LEVEL=error    # Solo errores críticos
```

**Niveles disponibles (de más a menos verbose):**
```
silly    → TODO absolutamente
debug    → Debug info + HTTP + Errors
verbose  → Verbose + HTTP + Errors
http     → Requests/Responses + Errors (recomendado dev)
info     → Información general + Errors (recomendado prod)
warn     → Warnings + Errors
error    → Solo errores
```

## 🛡️ Seguridad - Datos Sanitizados

El logger **automáticamente oculta** datos sensibles:

### Headers Redactados
```json
{
  "authorization": "[REDACTED]",
  "cookie": "[REDACTED]",
  "x-api-key": "[REDACTED]",
  "x-auth-token": "[REDACTED]"
}
```

### Body Sanitizado
Campos automáticamente ocultados:
- `password`
- `token`
- `apiKey`
- `secret`
- `authorization`
- `creditCard`
- Y más... (ver `DataSanitizer`)

**Ejemplo:**
```json
// Request original
{
  "email": "user@test.com",
  "password": "SuperSecret123!"
}

// En los logs
{
  "email": "user@test.com",
  "password": "***REDACTED***"  // ← Oculto automáticamente
}
```

## 📊 Ejemplos de Logs Completos

### 1. Login Exitoso
```
📥 Incoming Request: POST /api/auth/login
  request.body: { "email": "user@test.com", "password": "***REDACTED***" }

✅ Outgoing Response: POST /api/auth/login 200 45ms
  response.body: {
    "success": true,
    "accessToken": "***REDACTED***",
    "user": { "id": "123", "email": "user@test.com" }
  }
```

### 2. Error de Validación
```
📥 Incoming Request: POST /api/users
  request.body: { "name": "", "email": "invalid-email" }

⚠️ Outgoing Response: POST /api/users 400 12ms
  response.body: {
    "statusCode": 400,
    "message": ["email must be a valid email"],
    "error": "Bad Request"
  }
```

### 3. Error de Servidor
```
📥 Incoming Request: GET /api/users/999

❌ Outgoing Response: GET /api/users/999 500 123ms
  response.body: {
    "statusCode": 500,
    "message": "Internal server error"
  }
```

## 🎨 Mejoras Visuales

### Emojis por Status Code
- `📥` Entrada (Request)
- `✅` 200-299 (Success)
- `🔄` 300-399 (Redirect)
- `⚠️` 400-499 (Client Error)
- `❌` 500+ (Server Error)

### Colores en Consola
- **Verde:** Success (2xx)
- **Amarillo:** Warnings (4xx)
- **Rojo:** Errors (5xx)
- **Azul:** Info general

## 🔍 Debugging Tips

### Ver solo ciertos endpoints
```bash
# Ver solo requests a /auth
tail -f logs/http-$(date +%Y-%m-%d).log | grep "/auth"

# Ver solo errores 500
tail -f logs/http-error-$(date +%Y-%m-%d).log | grep "500"
```

### Ver request y response juntos
```bash
# Con jq (JSON pretty print)
tail -f logs/http-$(date +%Y-%m-%d).log | jq 'select(.message | contains("POST /api/auth/login"))'
```

### Buscar por usuario
```bash
tail -f logs/http-$(date +%Y-%m-%d).log | jq 'select(.user.userEmail == "user@test.com")'
```

## 🚀 Testing

Para probar el nuevo logging:

```bash
# 1. Iniciar la app
npm run start:dev

# 2. Hacer un request
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 3. Ver los logs en la consola
# Deberías ver:
# - 📥 Incoming Request con el body
# - ✅ Outgoing Response con el resultado
```

## 📝 Notas Importantes

1. **Los logs son verbosos en desarrollo** - Esto es intencional para debugging
2. **En producción usa `LOG_LEVEL=info`** - Reduce el volumen de logs
3. **Los archivos rotan automáticamente** - Se crea un archivo nuevo cada día
4. **Retención: 30 días** - Los archivos viejos se eliminan automáticamente
5. **Tamaño máximo: 20MB por archivo** - Se crea un nuevo archivo al llegar al límite

## 🆘 Troubleshooting

### No veo los logs en la consola
```bash
# Verificar nivel de log
grep LOG_LEVEL .env

# Debe ser: debug, verbose, http, o info
# NO debe ser: error (solo muestra errores)
```

### Los logs no tienen response body
```bash
# Verificar que LoggingInterceptor esté habilitado en app.module.ts
# Debe estar en el array de APP_INTERCEPTOR
```

### Headers no aparecen
```bash
# Verificar que LOG_LEVEL=debug
# Los headers solo se muestran en modo debug/verbose
```

## 🎯 Resumen

✅ **Ahora puedes ver:**
- Todo lo que LLEGA (request body, headers, params)
- Todo lo que SALE (response body, status)
- Timing de cada request
- Usuario autenticado
- Device info
- Datos sensibles automáticamente ocultos

✅ **Mejoras aplicadas:**
- Emojis visuales para identificar rápido
- Headers del request (sin datos sensibles)
- Response body completo
- Mejor formato y colores
- Santización automática de passwords/tokens

¡Ahora puedes debuggear fácilmente viendo exactamente qué envías y qué recibes! 🎉

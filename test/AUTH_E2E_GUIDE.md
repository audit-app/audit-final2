# Auth E2E Tests - Guía Completa

Tests de integración completos para el módulo de autenticación. Estos tests prueban el flujo **real** sin mocks.

## 🎯 ¿Qué se prueba?

### ✅ Integración completa:
- **PostgreSQL**: Crea usuarios reales en la base de datos
- **Redis**: Verifica almacenamiento de tokens (refresh, 2FA, reset-password)
- **JWT**: Generación y validación de tokens
- **Bcrypt**: Hashing de contraseñas
- **Rate Limiting**: Throttler global de NestJS
- **Concurrencia**: Múltiples requests simultáneos

### ✅ Flujos completos probados:

1. **Login Flow** (líneas 135-200)
   - Login exitoso
   - Credenciales inválidas
   - Email inexistente
   - Validación DTO

2. **Refresh Token Flow** (líneas 202-259)
   - Renovar access token
   - Token inválido
   - Token revocado

3. **Logout** (líneas 261-293)
   - Revocación de tokens en Redis
   - Verificación de revocación

4. **2FA Flow** (líneas 295-404)
   - Generar código
   - Verificar código válido
   - Código inválido
   - One-time use
   - Resend código

5. **Reset Password** (líneas 406-567)
   - Request reset
   - Reset con token válido
   - Token expirado
   - One-time use
   - Rate limiting

6. **Seguridad** (líneas 569-591)
   - JWT malformado
   - Firma inválida

7. **Redis Integration** (líneas 593-622)
   - TTL de tokens
   - Limpieza automática

8. **Performance** (líneas 624-647)
   - 10 logins concurrentes

## 🚀 Ejecutar los tests

### Pre-requisitos:

```bash
# Docker DEBE estar corriendo (PostgreSQL + Redis)
docker compose up -d

# Verificar que estén corriendo
docker compose ps
```

### Ejecutar:

```bash
# Solo tests de auth
npm run test:e2e -- auth.e2e-spec.ts

# Todos los tests E2E
npm run test:e2e

# Con watch mode (útil para desarrollo)
npm run test:e2e -- --watch auth.e2e-spec.ts

# Con coverage
npm run test:e2e -- --coverage auth.e2e-spec.ts
```

## 📝 Estructura del test

### Setup (beforeAll):
```typescript
beforeAll(async () => {
  // 1. Crea módulo completo de NestJS
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  // 2. Inicializa app con ValidationPipe
  app = moduleFixture.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ ... }))
  await app.init()

  // 3. Obtiene conexiones reales
  dataSource = moduleFixture.get<DataSource>(DataSource)
  redis = moduleFixture.get<Redis>(REDIS_CLIENT)

  // 4. Crea datos de prueba
  // - Organización
  // - Usuario con contraseña hasheada
})
```

### Cleanup (afterAll):
```typescript
afterAll(async () => {
  // 1. Limpia Redis (todos los tokens)
  const keys = await redis.keys('*')
  await redis.del(...keys)

  // 2. Limpia base de datos
  await dataSource.query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds])
  await dataSource.query('DELETE FROM organizations WHERE id = $1', [orgId])

  // 3. Cierra conexiones
  await app.close()
})
```

### Anatomía de un test:
```typescript
it('should login successfully', async () => {
  // Arrange (preparar datos)
  const credentials = { email: 'test@example.com', password: 'Test123!' }

  // Act (ejecutar acción)
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send(credentials)
    .expect(200)

  // Assert (verificar resultados)
  expect(response.body).toMatchObject({
    accessToken: expect.any(String),
    refreshToken: expect.any(String),
  })

  // Assert Redis (verificar side effects)
  const keys = await redis.keys(`auth:refresh:${userId}:*`)
  expect(keys.length).toBeGreaterThan(0)
})
```

## 🔧 Cómo agregar nuevos tests

### Ejemplo 1: Probar nuevo endpoint de "Change Email"

```typescript
describe('POST /auth/change-email - Change Email Flow', () => {
  let accessToken: string

  beforeEach(async () => {
    // Login para obtener access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })

    accessToken = loginResponse.body.accessToken
  })

  it('should change email with valid token', async () => {
    const newEmail = 'newemail@example.com'

    // Act
    const response = await request(app.getHttpServer())
      .post('/auth/change-email')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ newEmail })
      .expect(200)

    // Assert
    expect(response.body.message).toContain('Email actualizado')

    // Verify in database
    const user = await dataSource.query(
      'SELECT email FROM users WHERE id = $1',
      [testUser.id]
    )
    expect(user[0].email).toBe(newEmail)

    // Verify old refresh tokens are revoked (security)
    const keys = await redis.keys(`auth:refresh:${testUser.id}:*`)
    expect(keys.length).toBe(0)
  })

  it('should fail with duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/auth/change-email')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ newEmail: 'existing@example.com' })
      .expect(409) // Conflict
  })
})
```

### Ejemplo 2: Probar sesiones múltiples

```typescript
describe('Sessions - Multiple Device Login', () => {
  it('should allow user to login from multiple devices', async () => {
    // Login desde dispositivo 1
    const device1 = await request(app.getHttpServer())
      .post('/auth/login')
      .set('User-Agent', 'Mozilla/5.0 (iPhone)')
      .send({ email: testUser.email, password: testUser.password })

    // Login desde dispositivo 2
    const device2 = await request(app.getHttpServer())
      .post('/auth/login')
      .set('User-Agent', 'Mozilla/5.0 (Android)')
      .send({ email: testUser.email, password: testUser.password })

    // Assert: ambos tokens son válidos
    expect(device1.body.accessToken).toBeDefined()
    expect(device2.body.accessToken).toBeDefined()

    // Assert: 2 sesiones en Redis
    const sessions = await redis.keys(`auth:refresh:${testUser.id}:*`)
    expect(sessions.length).toBe(2)

    // Logout desde device1
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: device1.body.refreshToken })

    // Device 2 sigue funcionando
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: device2.body.refreshToken })
      .expect(200)

    // Device 1 no funciona
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: device1.body.refreshToken })
      .expect(401)
  })
})
```

### Ejemplo 3: Probar trusted devices

```typescript
describe('Trusted Devices', () => {
  it('should mark device as trusted and skip 2FA', async () => {
    // Login inicial (con 2FA)
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })

    const deviceFingerprint = 'device-123-abc'

    // Mark device as trusted
    await request(app.getHttpServer())
      .post('/auth/devices/trust')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .send({ deviceFingerprint })
      .expect(200)

    // Verify device is stored in Redis
    const trustedDevices = await redis.smembers(
      `auth:trusted-devices:${testUser.id}`
    )
    expect(trustedDevices).toContain(deviceFingerprint)

    // Login desde mismo device - debería skipear 2FA
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Device-Fingerprint', deviceFingerprint)
      .send({ email: testUser.email, password: testUser.password })

    // No debería requerir 2FA
    expect(response.body.requires2FA).toBe(false)
    expect(response.body.accessToken).toBeDefined()
  })
})
```

## 📊 Verificar integración con Redis

```typescript
describe('Redis Verification', () => {
  it('should store tokens with correct TTL', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })

    // Check refresh token
    const refreshKeys = await redis.keys(`auth:refresh:${testUser.id}:*`)
    const ttl = await redis.ttl(refreshKeys[0])
    expect(ttl).toBeGreaterThan(0)
    expect(ttl).toBeLessThanOrEqual(604800) // 7 days
  })

  it('should cleanup old sessions on logout', async () => {
    // Create 3 sessions
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
    }

    const sessionsBefore = await redis.keys(`auth:refresh:${testUser.id}:*`)
    expect(sessionsBefore.length).toBe(3)

    // Logout all
    await request(app.getHttpServer())
      .post('/auth/logout-all')
      .send({ userId: testUser.id })

    const sessionsAfter = await redis.keys(`auth:refresh:${testUser.id}:*`)
    expect(sessionsAfter.length).toBe(0)
  })
})
```

## 🐛 Debugging tests

### Ver logs durante tests:

```typescript
// Añade console.logs temporales
it('should debug login flow', async () => {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: testUser.email, password: testUser.password })

  console.log('Response:', response.body)
  console.log('Status:', response.status)
  console.log('Headers:', response.headers)

  // Check Redis
  const keys = await redis.keys('*')
  console.log('Redis keys:', keys)

  for (const key of keys) {
    const value = await redis.get(key)
    console.log(`${key} = ${value}`)
  }
})
```

### Ejecutar un solo test:

```bash
# Solo un describe
npm run test:e2e -- auth.e2e-spec.ts -t "Login Flow"

# Solo un it
npm run test:e2e -- auth.e2e-spec.ts -t "should login successfully"
```

### Ver queries SQL:

```typescript
// En beforeAll, activa query logging
dataSource.options.logging = true
```

## 💡 Tips

1. **Los tests E2E son lentos** - Es normal, usan servicios reales
2. **Docker debe estar corriendo** - No funcionan sin PostgreSQL + Redis
3. **Limpieza es crítica** - Siempre limpia en afterAll o afterEach
4. **Tests aislados** - Cada test debe ser independiente
5. **No usar datos hardcodeados** - Usa variables y UUIDs únicos
6. **Verificar Redis** - Siempre verifica side effects en Redis
7. **Usar --runInBand** - Para tests que modifican estado compartido

## 🔒 Seguridad en tests

### ❌ NO hacer:
```typescript
// NO guardes contraseñas en claro
const password = 'password123'

// NO uses emails reales
const email = 'john@gmail.com'

// NO dejes datos de prueba en producción
```

### ✅ Hacer:
```typescript
// Usa prefijos claros
const email = 'test-e2e-auth@example.com'

// Genera datos únicos
const username = `testuser-${Date.now()}`

// Limpia todo en afterAll
afterAll(async () => {
  await dataSource.query('DELETE FROM users WHERE email LIKE $1', ['test-%'])
})
```

## 📈 Métricas esperadas

- ✅ **Coverage**: >80% en auth module
- ✅ **Tiempo**: ~20-30 segundos para todo el suite
- ✅ **Estabilidad**: 0 flaky tests
- ✅ **Paralelización**: Usar `--runInBand` si hay problemas

## 🚀 CI/CD Integration

```yaml
# .github/workflows/test.yml
test-e2e:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_PASSWORD: postgres
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
    redis:
      image: redis:7
      options: >-
        --health-cmd "redis-cli ping"
        --health-interval 10s
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
    - run: npm ci
    - run: npm run test:e2e
```

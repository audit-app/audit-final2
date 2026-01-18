# Patrones de Rate Limiting

Este documento explica cuándo usar `BaseRateLimitPolicy` vs `RateLimitService` directo.

## 📊 Dos Patrones Diferentes

### Patrón 1: BaseRateLimitPolicy (Rate Limiting por Usuario)

**Cuándo usar:**
- ✅ El límite es **por usuario/email/IP**
- ✅ Es un límite **global y reutilizable**
- ✅ Quieres lógica consistente entre diferentes flujos
- ✅ El contador persiste mientras la ventana esté activa

**Ejemplos:**
- Login (5 intentos cada 15 minutos por usuario)
- Request Reset Password (5 solicitudes cada 15 minutos por email)
- Generate 2FA Code (5 códigos cada 15 minutos por userId)
- Resend 2FA Code (cooldown de 60 segundos por userId)

**Implementación:**

```typescript
// 1. Crear la política (extiende BaseRateLimitPolicy)
@Injectable()
export class LoginRateLimitPolicy extends BaseRateLimitPolicy {
  constructor(rateLimitService: RateLimitService) {
    super(
      rateLimitService,
      'login',        // Contexto (prefijo en Redis)
      5,              // Máximo de intentos
      15,             // Ventana en minutos
    )
  }
}

// 2. Usar en el Use Case
@Injectable()
export class LoginUseCase {
  constructor(
    private readonly loginRateLimitPolicy: LoginRateLimitPolicy,
  ) {}

  async execute(email: string, password: string) {
    // Verificar límite (lanza TooManyAttemptsException si excede)
    await this.loginRateLimitPolicy.checkLimitOrThrow(email)

    // Registrar intento fallido
    await this.loginRateLimitPolicy.registerFailure(email)

    // ... lógica de login

    // Si login exitoso, limpiar contador
    await this.loginRateLimitPolicy.clearRecords(email)
  }
}
```

**Redis Key:** `rate-limit:login:user@example.com`

---

### Patrón 2: RateLimitService Directo (Rate Limiting por Token)

**Cuándo usar:**
- ✅ El límite es **por token/sesión específica**
- ✅ Necesitas **lógica custom** (como "token burning")
- ✅ El límite es **temporal** (vinculado al ciclo de vida del token)
- ✅ Cada token tiene su propio contador independiente

**Ejemplos:**
- Verify OTP en Reset Password (3 intentos por token)
- Verify 2FA Code (3 intentos por token)
- Cualquier flujo con "token burning"

**Implementación:**

```typescript
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly otpCoreService: OtpCoreService,
  ) {}

  async execute(tokenId: string, otpCode: string, newPassword: string) {
    const CONTEXT = 'reset-pw'
    const ATTEMPTS_KEY = `attempts:${CONTEXT}:${tokenId}`
    const MAX_ATTEMPTS = 3
    const WINDOW_MINUTES = 15

    // 1. Incrementar contador (antes de validar)
    const attempts = await this.rateLimitService.incrementAttempts(
      ATTEMPTS_KEY,
      WINDOW_MINUTES,
    )

    // 2. Si excede intentos → QUEMAR TOKEN
    if (attempts > MAX_ATTEMPTS) {
      await this.otpCoreService.deleteSession(CONTEXT, tokenId)
      await this.rateLimitService.resetAttempts(ATTEMPTS_KEY)
      throw new BadRequestException('Token quemado por exceso de intentos')
    }

    // 3. Validar código
    const { isValid, payload } = await this.otpCoreService.validateSession(
      CONTEXT,
      tokenId,
      otpCode,
    )

    if (!isValid) {
      const remaining = MAX_ATTEMPTS - attempts
      throw new BadRequestException(`Código incorrecto. Te quedan ${remaining} intentos.`)
    }

    // 4. Código válido → Quemar token (one-time use)
    await this.otpCoreService.deleteSession(CONTEXT, tokenId)
    await this.rateLimitService.resetAttempts(ATTEMPTS_KEY)

    // ... lógica de negocio
  }
}
```

**Redis Key:** `rate-limit:attempts:reset-pw:{tokenId-abc123}`

---

## 🎯 Comparación Lado a Lado

| Característica | BaseRateLimitPolicy | RateLimitService Directo |
|---------------|---------------------|--------------------------|
| **Identificador** | Usuario/Email/IP | Token/Sesión específica |
| **Persistencia** | Durante la ventana de tiempo | Vinculado al token |
| **Reutilizable** | Sí (diferentes use cases) | No (lógica específica) |
| **Encapsulación** | Alta (abstracción) | Baja (control fino) |
| **Lógica Custom** | Limitada | Total |
| **Token Burning** | No | Sí |
| **Ejemplos** | Login, Request Reset, Generate 2FA | Verify OTP, Verify 2FA |

---

## 📁 Ejemplos Completos en el Proyecto

### ✅ BaseRateLimitPolicy (Request Reset Password)

```typescript
// src/modules/auth/password-reset/policies/request-reset-password-rate-limit.policy.ts
@Injectable()
export class RequestResetPasswordRateLimitPolicy extends BaseRateLimitPolicy {
  constructor(rateLimitService: RateLimitService) {
    super(
      rateLimitService,
      'reset-password',
      PASSWORD_RESET_CONFIG.rateLimit.maxAttemptsByEmail,
      PASSWORD_RESET_CONFIG.rateLimit.windowMinutes,
    )
  }
}

// src/modules/auth/password-reset/use-cases/request-reset/request-reset-password.use-case.ts
const canAttempt = await this.requestResetPasswordRateLimitPolicy.canAttempt(email)
if (!canAttempt) {
  return genericResponse // Silent drop
}
await this.requestResetPasswordRateLimitPolicy.registerFailure(email)
```

**Propósito:** Limitar cuántas veces un usuario puede solicitar un reset (evitar spam de emails)

---

### ✅ RateLimitService Directo (Reset Password)

```typescript
// src/modules/auth/password-reset/use-cases/password-reset/reset-password.use-case.ts
const ATTEMPTS_KEY = `attempts:${CONTEXT}:${tokenId}`
const attempts = await this.rateLimitService.incrementAttempts(ATTEMPTS_KEY, 15)

if (attempts > 3) {
  // QUEMAR TOKEN
  await this.otpCoreService.deleteSession(CONTEXT, tokenId)
  await this.rateLimitService.resetAttempts(ATTEMPTS_KEY)
  throw new BadRequestException('Token quemado por exceso de intentos')
}
```

**Propósito:** Limitar cuántos intentos de verificar el OTP permite por token (evitar brute force del código)

---

## 🔑 Conclusión

**NO está mal usar ambos enfoques.** Son **dos capas de seguridad complementarias:**

1. **Primera capa (BaseRateLimitPolicy):** Protege al USUARIO
   - "No puedes solicitar 100 resets en 1 minuto"

2. **Segunda capa (RateLimitService directo):** Protege el TOKEN
   - "No puedes intentar 1000 códigos en un token específico"

**Ambos son necesarios** para una seguridad robusta.

---

## 📚 Referencias

- `src/@core/security/services/base-rate-policy.service.ts` - Base para políticas
- `src/@core/security/services/rate-limit.service.ts` - Servicio bajo nivel
- `src/modules/auth/password-reset/` - Ejemplo completo de ambos patrones
- `src/modules/auth/two-factor/` - Otro ejemplo de ambos patrones

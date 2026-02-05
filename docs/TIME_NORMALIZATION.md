# Time Normalization System

## Problem Solved

Previously, the system had time values scattered across environment variables with inconsistent units:

- JWT expected strings like `"15m"`, `"7d"`
- Redis TTL expected seconds (numeric)
- Cookies `maxAge` expected milliseconds (numeric)
- UI/emails needed human-readable minutes

This caused issues like:
- **Bug Example**: 2FA resend cooldown showing as "33400" in emails instead of "1 minute"
- **Developer confusion**: Which unit does this config value use?
- **Conversion bugs**: Forgetting to multiply by 1000 when converting seconds to milliseconds
- **Maintenance overhead**: Duplicate conversions scattered throughout codebase

## Solution: Single Source of Truth

The `NormalizedTime` interface provides all time units from a single source:

```typescript
interface NormalizedTime {
  raw: string      // "5m" - for JWT and external libraries
  ms: number       // 300000 - for cookies, setTimeout, Date operations
  seconds: number  // 300 - for Redis TTL, rate limiting
  minutes: number  // 5 - for display in UI, emails, logs
}
```

## How It Works

### 1. Time Parsing (using `ms` library)

The `ms` library (same one used internally by `jsonwebtoken`) parses time strings:

```typescript
import { normalizeTime } from '@core/config/time-normalizer'

// Parse a time string
const time = normalizeTime("5m")
// {
//   raw: "5m",
//   ms: 300000,
//   seconds: 300,
//   minutes: 5
// }
```

### 2. Configuration Normalization

All time values are normalized at **config load time** (in `envs.ts`):

```typescript
// Before (PROBLEMATIC):
twoFactor: {
  codeExpiresIn: "5m",                    // String - para JWT?
  resendCooldownSeconds: 60,              // Seconds - para Redis?
}

// After (NORMALIZED):
twoFactor: {
  codeExpires: normalizeTime("5m"),       // NormalizedTime object
  resendCooldown: normalizeTimeFromSeconds(60),  // NormalizedTime object
}
```

### 3. Services Use Appropriate Units

Each service explicitly chooses the unit it needs:

```typescript
// JWT Service - uses .raw for jsonwebtoken
this.jwtService.signAsync(payload, {
  expiresIn: envs.jwt.accessExpires.raw  // "15m"
})

// Redis Service - uses .seconds for TTL
await redis.set(key, value, envs.twoFactor.codeExpires.seconds)  // 300

// Cookie Service - uses .ms for maxAge
res.cookie('token', value, {
  maxAge: envs.jwt.refreshExpires.ms  // 604800000
})

// Email Template - uses .minutes for display
const message = `El código expira en ${envs.twoFactor.codeExpires.minutes} minutos`
// "El código expira en 5 minutos" ✅ (instead of "33400" ❌)
```

## Available Normalizer Functions

### `normalizeTime(timeStr: string): NormalizedTime`

Parses time strings using `ms` library format.

**Supported formats:**
- `"30s"` - seconds
- `"5m"` - minutes
- `"1h"` - hours
- `"7d"` - days
- `"2w"` - weeks

**Validation:**
- Throws error for invalid formats
- Throws error for negative/zero values
- Throws error for values > 365 days (prevents accidental infinite TTLs)

```typescript
const time = normalizeTime("15m")
// { raw: "15m", ms: 900000, seconds: 900, minutes: 15 }
```

### `normalizeTimeFromSeconds(seconds: number): NormalizedTime`

Converts numeric seconds to NormalizedTime.

```typescript
const cooldown = normalizeTimeFromSeconds(60)
// { raw: "60s", ms: 60000, seconds: 60, minutes: 1 }
```

### `normalizeTimeFromMinutes(minutes: number): NormalizedTime`

Converts numeric minutes to NormalizedTime.

```typescript
const window = normalizeTimeFromMinutes(15)
// { raw: "15m", ms: 900000, seconds: 900, minutes: 15 }
```

### `normalizeTimeFromDays(days: number): NormalizedTime`

Converts numeric days to NormalizedTime.

```typescript
const ttl = normalizeTimeFromDays(90)
// { raw: "90d", ms: 7776000000, seconds: 7776000, minutes: 129600 }
```

## Configuration Examples

### JWT Tokens

```typescript
// envs.ts
jwt: {
  accessExpires: normalizeTime("15m"),
  refreshExpires: normalizeTime("7d"),
}

// Usage in TokensService
await this.jwtService.signAsync(payload, {
  expiresIn: envs.jwt.accessExpires.raw  // "15m" - JWT library format
})

// Usage in Redis for TTL
await redis.set(key, value, envs.jwt.refreshExpires.seconds)  // 604800

// Usage in cookies
res.cookie('refreshToken', token, {
  maxAge: envs.jwt.refreshExpires.ms  // 604800000
})
```

### Two-Factor Authentication

```typescript
// envs.ts
twoFactor: {
  codeExpires: normalizeTime("5m"),
  resendCooldown: normalizeTimeFromSeconds(60),
  trustedDeviceExpires: normalizeTimeFromDays(90),
}

// Usage in OTP Service (Redis)
await this.otpService.createSession(context, payload,
  envs.twoFactor.codeExpires.seconds  // 300
)

// Usage in Email Template
const msg = `El código expira en ${envs.twoFactor.codeExpires.minutes} minutos`
// "El código expira en 5 minutos" ✅
```

### Password Reset

```typescript
// envs.ts
passwordReset: {
  tokenExpires: normalizeTime("1h"),
  window: normalizeTimeFromMinutes(60),
  resendCooldown: normalizeTimeFromSeconds(60),
}

// Usage in Email
const msg = `Este enlace expira en ${envs.passwordReset.tokenExpires.minutes} minutos`
// "Este enlace expira en 60 minutos" ✅
```

### Rate Limiting

```typescript
// envs.ts
login: {
  window: normalizeTimeFromMinutes(15),
}

// Usage in Rate Limit Service
await this.rateLimitService.incrementAttempts(key,
  envs.login.window.minutes  // 15
)
```

## Migration Guide

If you need to add a new time-based configuration:

### 1. Add to Environment Schema

```typescript
// envs.ts - Schema validation
const envVarsSchema = Joi.object({
  MY_NEW_TIME_CONFIG: timeFormatValidator.default('10m'),
})
```

### 2. Normalize in Config Export

```typescript
// envs.ts - Config export
export const envs = {
  myFeature: {
    timeout: normalizeTime(validatedEnv.MY_NEW_TIME_CONFIG as string),
  },
}
```

### 3. Use Appropriate Unit in Service

```typescript
// For JWT
jwt.sign(payload, { expiresIn: envs.myFeature.timeout.raw })

// For Redis
redis.set(key, value, envs.myFeature.timeout.seconds)

// For Cookies
res.cookie('name', value, { maxAge: envs.myFeature.timeout.ms })

// For Display
const msg = `Timeout: ${envs.myFeature.timeout.minutes} minutes`
```

## Benefits

✅ **Type Safety**: TypeScript ensures you use the correct property
✅ **No Manual Conversions**: System handles all unit conversions
✅ **Fail-Fast Validation**: Invalid time formats caught at startup, not runtime
✅ **Consistency**: Same pattern across entire codebase
✅ **Clarity**: Explicit unit selection prevents confusion
✅ **Maintainability**: Single place to change time values
✅ **Bug Prevention**: Eliminates conversion errors

## Testing

All normalizer functions have comprehensive test coverage (33 tests):

```bash
npm test -- time-normalizer.spec.ts
```

Tests cover:
- All time formats (seconds, minutes, hours, days, weeks)
- Error cases (invalid formats, negative values, zero, exceeding 1 year)
- Real-world scenarios (JWT tokens, 2FA codes, Redis TTL, cookies)
- Type safety

## Environment Variables

No breaking changes to `.env` file - all existing time values work as before:

```bash
# String formats (parsed by ms library)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
TWO_FACTOR_CODE_EXPIRES_IN=5m
RESET_PASSWORD_TOKEN_EXPIRES_IN=1h
EMAIL_VERIFICATION_EXPIRES_IN=7d

# Numeric formats (converted to NormalizedTime)
TWO_FACTOR_RESEND_COOLDOWN_SECONDS=60
TRUSTED_DEVICE_TTL_DAYS=90
LOGIN_ATTEMPTS_WINDOW_MINUTES=15
TWO_FACTOR_VERIFY_WINDOW_MINUTES=10
```

## Further Reading

- [ms Library Documentation](https://github.com/vercel/ms)
- [JWT vs Redis Time Format](./JWT_VS_REDIS_TIME_FORMAT.md)
- [Token Storage Unification](./TOKEN_STORAGE_UNIFICATION.md)

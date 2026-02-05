# Login Rate Limiting Options

## Overview

The login system implements **user-based rate limiting** to protect against brute-force attacks while preventing user enumeration. Rate limits are tracked per email address in Redis with automatic expiration.

## Current Configuration

### Environment Variables

```bash
# .env file
MAX_LOGIN_ATTEMPTS_IP=10          # Not currently used (reserved for future IP-based limiting)
MAX_LOGIN_ATTEMPTS_USER=5         # Maximum failed login attempts per user
LOGIN_ATTEMPTS_WINDOW_MINUTES=15  # Time window for attempt tracking
```

### Default Values (from envs.ts)

```typescript
login: {
  maxAttemptsByIp: 10,      // Reserved for future use
  maxAttemptsByUser: 5,     // ✅ Currently active
  window: normalizeTimeFromMinutes(15),  // ✅ Currently active
}
```

## How It Works

### 1. Rate Limit Check (Before Password Verification)

```typescript
// LoginUseCase - Line 54
await this.loginRateLimitPolicy.checkLimitOrThrow(user.email)
```

**When:**
- AFTER verifying user exists
- BEFORE checking password

**Why this order:**
- If we check rate limit first: attacker can enumerate users by seeing different error messages
- If we check after user exists: we protect the account without revealing existence

**If blocked:**
```json
{
  "statusCode": 429,
  "message": "Has excedido el número de intentos de login. Inténtalo de nuevo en 12 minutos."
}
```

### 2. Register Failed Attempt

```typescript
// LoginUseCase - Lines 63, 76
await this.loginRateLimitPolicy.registerFailure(user.email)
```

**Triggered when:**
- User exists but has no password (Google OAuth user trying local login)
- Password is incorrect

**What happens:**
- Increments Redis counter: `rate-limit:login:user@example.com`
- Sets TTL of 15 minutes (from `LOGIN_ATTEMPTS_WINDOW_MINUTES`)
- After 5 failed attempts (from `MAX_LOGIN_ATTEMPTS_USER`), user is blocked

### 3. Clear Records (After Successful Login)

```typescript
// LoginUseCase - Line 93
await this.loginRateLimitPolicy.clearRecords(user.email)
```

**Triggered when:**
- Login successful (password correct, user active)

**What happens:**
- Deletes Redis key: `rate-limit:login:user@example.com`
- User can immediately try again if they make a mistake later

## Configuration Options

### Option 1: Change Maximum Attempts

**Conservative (High Security):**
```bash
MAX_LOGIN_ATTEMPTS_USER=3  # Only 3 attempts before lockout
```

**Balanced (Recommended):**
```bash
MAX_LOGIN_ATTEMPTS_USER=5  # Default - good balance
```

**Permissive (User-Friendly):**
```bash
MAX_LOGIN_ATTEMPTS_USER=10  # More forgiving for typos
```

### Option 2: Change Lockout Window

**Short Window (Lenient):**
```bash
LOGIN_ATTEMPTS_WINDOW_MINUTES=5  # Unlock after 5 minutes
```

**Medium Window (Recommended):**
```bash
LOGIN_ATTEMPTS_WINDOW_MINUTES=15  # Default - standard security
```

**Long Window (Strict):**
```bash
LOGIN_ATTEMPTS_WINDOW_MINUTES=60  # 1 hour lockout
```

### Option 3: Combine for Different Security Levels

**Development/Testing:**
```bash
MAX_LOGIN_ATTEMPTS_USER=20
LOGIN_ATTEMPTS_WINDOW_MINUTES=1
```

**Production (Standard):**
```bash
MAX_LOGIN_ATTEMPTS_USER=5
LOGIN_ATTEMPTS_WINDOW_MINUTES=15
```

**Production (High Security - Banking, Healthcare):**
```bash
MAX_LOGIN_ATTEMPTS_USER=3
LOGIN_ATTEMPTS_WINDOW_MINUTES=30
```

**Production (User-Friendly - E-commerce):**
```bash
MAX_LOGIN_ATTEMPTS_USER=8
LOGIN_ATTEMPTS_WINDOW_MINUTES=10
```

## Redis Key Structure

### Key Format
```
rate-limit:login:{email}
```

### Example
```bash
# User: john.doe@example.com
# Key: rate-limit:login:john.doe@example.com
# Value: 3  (3 failed attempts)
# TTL: 720 seconds (12 minutes remaining)
```

### Inspection Commands

```bash
# Check current attempts for a user
redis-cli GET "rate-limit:login:user@example.com"

# Check TTL (time until reset)
redis-cli TTL "rate-limit:login:user@example.com"

# Manually unlock a user
redis-cli DEL "rate-limit:login:user@example.com"

# List all login rate limit keys
redis-cli KEYS "rate-limit:login:*"
```

## User Flow Examples

### Scenario 1: Normal Login (Success)

```
1. User enters email + password
2. System finds user in database ✓
3. System checks rate limit: 0 attempts ✓
4. System verifies password ✓
5. System clears rate limit counter
6. User logged in ✓
```

### Scenario 2: Wrong Password (< 5 attempts)

```
1. User enters email + wrong password
2. System finds user in database ✓
3. System checks rate limit: 2 attempts ✓
4. System verifies password ✗
5. System increments counter to 3
6. Error: "Credenciales inválidas"
```

### Scenario 3: Account Locked (≥ 5 attempts)

```
1. User enters email + password
2. System finds user in database ✓
3. System checks rate limit: 5 attempts ✗
4. System throws TooManyAttemptsException
5. Error: "Has excedido el número de intentos. Inténtalo en 10 minutos."
```

### Scenario 4: User Doesn't Exist

```
1. User enters non-existent email
2. System doesn't find user in database ✗
3. Error: "Credenciales inválidas"
   (IMPORTANT: Same error message as wrong password)
```

## Security Features

### ✅ Anti-Enumeration Protection

```typescript
// GOOD: Same error message whether user exists or not
if (!user) {
  throw new InvalidCredentialsException()  // Generic message
}

if (!isPasswordValid) {
  await this.loginRateLimitPolicy.registerFailure(user.email)
  throw new InvalidCredentialsException()  // Same generic message
}
```

**Why:** Attackers can't determine if an email exists in the system.

### ✅ Account Protection Order

```typescript
// 1. Check if user exists
// 2. Check rate limit (ONLY if user exists)
// 3. Verify password
```

**Why:** We only rate-limit accounts that actually exist, protecting them from brute-force.

### ✅ Automatic Cleanup

```typescript
// Successful login → clear counter
await this.loginRateLimitPolicy.clearRecords(user.email)
```

**Why:** Legitimate users don't get permanently locked after occasional typos.

### ✅ Window-Based Expiration

```typescript
// Redis TTL automatically expires the counter
await this.rateLimitService.incrementAttempts(key, this.windowMinutes)
```

**Why:** No manual cleanup needed, keys auto-expire after window.

## Future Enhancements (Not Currently Implemented)

### IP-Based Rate Limiting

```typescript
// Not implemented yet, but prepared in config
maxAttemptsByIp: 10,  // Limit login attempts per IP address
```

**Use case:** Prevent distributed attacks from multiple accounts.

### Exponential Backoff

```typescript
// Potential enhancement
const backoffMinutes = Math.pow(2, attemptCount) // 1, 2, 4, 8, 16 minutes
```

**Use case:** Increase lockout time with each subsequent lockout.

### Email Notification

```typescript
// Potential enhancement
if (attemptCount >= 3) {
  await emailService.sendSecurityAlert(user.email, {
    message: 'Multiple failed login attempts detected',
    ip: connection.ip,
    timestamp: new Date(),
  })
}
```

**Use case:** Alert users of potential unauthorized access attempts.

### CAPTCHA After N Attempts

```typescript
// Potential enhancement
if (attemptCount >= 3 && !dto.captchaToken) {
  throw new CaptchaRequiredException()
}
```

**Use case:** Add CAPTCHA verification before account lockout.

## Testing

### Manual Testing

```bash
# 1. Try logging in with wrong password 5 times
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail": "test@example.com", "password": "wrong"}'

# 2. Check Redis
redis-cli GET "rate-limit:login:test@example.com"
# Expected: 5

# 3. Try 6th attempt (should be blocked)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail": "test@example.com", "password": "wrong"}'
# Expected: 429 Too Many Attempts

# 4. Wait 15 minutes OR manually unlock
redis-cli DEL "rate-limit:login:test@example.com"

# 5. Try again (should work)
```

### Programmatic Testing

```typescript
// login.e2e-spec.ts
it('should block user after 5 failed attempts', async () => {
  // Arrange
  const wrongPassword = 'wrongpassword'

  // Act: Try 5 times with wrong password
  for (let i = 0; i < 5; i++) {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ usernameOrEmail: 'test@example.com', password: wrongPassword })
      .expect(401)
  }

  // Assert: 6th attempt should be blocked
  await request(app.getHttpServer())
    .post('/auth/login')
    .send({ usernameOrEmail: 'test@example.com', password: wrongPassword })
    .expect(429)
    .expect((res) => {
      expect(res.body.message).toContain('Has excedido el número de intentos')
    })
})
```

## Troubleshooting

### Issue: User locked out but didn't make attempts

**Cause:** Someone else trying to log into their account (attack attempt)

**Solution:**
```bash
# Manually unlock the user
redis-cli DEL "rate-limit:login:user@example.com"
```

### Issue: Rate limit not working

**Checks:**
1. Redis is running: `docker-compose ps`
2. Redis connection: `redis-cli PING` → should return `PONG`
3. Environment variables loaded: Check `envs.login.maxAttemptsByUser` value
4. Policy is registered: Check `auth.module.ts` providers array

### Issue: Different lockout times than expected

**Cause:** TTL starts from first failed attempt, not last one

**Example:**
```
10:00 - Failed attempt 1 (TTL set to 15 min → expires 10:15)
10:05 - Failed attempt 2 (TTL still 10:15)
10:10 - Failed attempt 3 (TTL still 10:15)
10:12 - Failed attempt 4 (TTL still 10:15)
10:14 - Failed attempt 5 (TTL still 10:15)
10:15 - Counter expires, user can try again
```

## Best Practices

### ✅ DO:
- Use normalized time values: `envs.login.window.minutes`
- Clear records after successful login
- Use generic error messages (anti-enumeration)
- Log rate limit violations for security monitoring
- Test rate limiting in staging before production

### ❌ DON'T:
- Don't reveal if user exists in error messages
- Don't rate-limit before checking if user exists (enumeration risk)
- Don't use overly strict limits that frustrate legitimate users
- Don't forget to clear Redis in test environments between test runs
- Don't hardcode time values (use config)

## Related Documentation

- [Time Normalization System](./TIME_NORMALIZATION.md) - How time values are handled
- [Rate Limiting Service](../src/@core/security/README.md) - Core rate limiting implementation
- [2FA Rate Limiting](./2FA_RATE_LIMITING.md) - Two-factor authentication rate limits
- [Password Reset Rate Limiting](./PASSWORD_RESET_RATE_LIMITING.md) - Reset password rate limits

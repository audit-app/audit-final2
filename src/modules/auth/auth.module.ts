import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { envs } from '@core/config'

import type * as ms from 'ms'

// ========================================
// LOGIN CONTEXT
// ========================================
import {
  AuthController,
  TokensService,
  LoginUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
  LoginRateLimitPolicy,
  GoogleLoginUseCase,
} from './login'

// ========================================
// TWO-FACTOR CONTEXT
// ========================================
import {
  TwoFactorController,
  TwoFactorTokenService,
  Verify2FACodeUseCase,
  Resend2FACodeUseCase,
  // Generate2FARateLimitPolicy, // TODO: Implementar si se necesita rate limiting en generate
  Resend2FARateLimitPolicy,
} from './two-factor'

// ========================================
// PASSWORD RESET CONTEXT
// ========================================
import {
  PasswordResetController,
  RequestResetPasswordUseCase,
  ResetPasswordUseCase,
} from './password-reset'

// ========================================
// EMAIL VERIFICATION CONTEXT
// ========================================
import {
  EmailVerificationController,
  EmailVerificationTokenService,
  RequestEmailVerificationUseCase,
  VerifyEmailUseCase,
} from './email-verification'

// ========================================
// TRUSTED DEVICES CONTEXT
// ========================================
import {
  TrustedDeviceRepository,
  DeviceFingerprintService,
  TrustedDevicesController,
  ListTrustedDevicesUseCase,
  RevokeTrustedDeviceUseCase,
  RevokeAllTrustedDevicesUseCase,
} from './trusted-devices'

// ========================================
// SESSIONS CONTEXT
// ========================================
import {
  SessionsController,
  ListSessionsUseCase,
  RevokeSessionUseCase,
  RevokeAllSessionsUseCase,
} from './sessions'

// ========================================
// GOOGLE OAUTH CONTEXT
// ========================================
import { GoogleAuthController } from './google'
import { GoogleStrategy } from './strategies/google.strategy'

// ========================================
// SHARED INFRASTRUCTURE
// ========================================
import { JwtStrategy, JwtAuthGuard } from './shared'
import { NavigationService } from '@shared'
import { RequestResetPasswordRateLimitPolicy } from './password-reset/policies'
import { TokenStorageRepository } from './login/services/token-storage.repository'

@Module({
  imports: [
    // Configuración de Passport
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false,
    }),

    // Configuración de JWT para access tokens (centralizado)
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = envs.jwt.accessSecret
        const expiresIn = envs.jwt.accessExpiresIn as ms.StringValue

        if (!secret) {
          throw new Error('JWT_SECRET is required')
        }

        return {
          secret,
          signOptions: {
            expiresIn,
          },
        }
      },
    }),
  ],

  controllers: [
    AuthController,
    PasswordResetController,
    TwoFactorController,
    EmailVerificationController,
    SessionsController,
    TrustedDevicesController,
    GoogleAuthController,
  ],

  providers: [
    // ========================================
    // Helpers
    // ========================================

    // ========================================
    // Repositories
    // ========================================
    TrustedDeviceRepository,

    // ========================================
    // Services
    // ========================================
    TokensService,
    TwoFactorTokenService,
    EmailVerificationTokenService,
    DeviceFingerprintService,
    NavigationService,

    // ========================================
    // Policies
    // ========================================
    LoginRateLimitPolicy,
    RequestResetPasswordRateLimitPolicy,
    // Generate2FARateLimitPolicy, // TODO: Implementar si se necesita
    Resend2FARateLimitPolicy,
    // ========================================
    // Use Cases
    // ========================================
    // Login/Logout/Refresh
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    GoogleLoginUseCase,

    // Password Reset
    RequestResetPasswordUseCase,
    ResetPasswordUseCase,

    // Two-Factor Authentication
    Verify2FACodeUseCase,
    Resend2FACodeUseCase,

    // Email Verification
    RequestEmailVerificationUseCase,
    VerifyEmailUseCase,

    // Sessions Management
    ListSessionsUseCase,
    RevokeSessionUseCase,
    RevokeAllSessionsUseCase,

    // Trusted Devices Management
    ListTrustedDevicesUseCase,
    RevokeTrustedDeviceUseCase,
    RevokeAllTrustedDevicesUseCase,

    // ========================================
    // Passport Strategies
    // ========================================
    JwtStrategy,
    GoogleStrategy,
    JwtAuthGuard,
    // ========================================
    // Global Guards (registrados como APP_GUARD)
    // ========================================
    /*     {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // ✅ Protege TODAS las rutas por defecto (usar @Public() para excepciones)
    }, */
    TokenStorageRepository,
  ],

  exports: [
    // Exportar helper para otros módulos si lo necesitan
    // Exportar repositories si otros módulos los necesitan
    TrustedDeviceRepository,
    // Exportar services si otros módulos los necesitan
    TokensService,
    TwoFactorTokenService,
    EmailVerificationTokenService,
    DeviceFingerprintService,
    NavigationService,
    // Exportar guards para uso manual si es necesario
    JwtAuthGuard,
  ],
})
export class AuthModule {}

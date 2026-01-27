import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { envs } from '@core/config'

import type * as ms from 'ms'

// ========================================
// CORE - Shared Infrastructure
// ========================================
import {
  TokensService,
  TokenStorageRepository,
  JwtStrategy,
  GoogleStrategy,
  JwtAuthGuard,
  LoginRateLimitPolicy,
  RequestResetPasswordRateLimitPolicy,
  Resend2FARateLimitPolicy,
} from './core'

// ========================================
// AUTHENTICATION - Local (Login/Logout/Refresh/Switch-Role)
// ========================================
import {
  AuthController,
  LoginUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
  SwitchRoleUseCase,
} from './authentication/local'

// ========================================
// AUTHENTICATION - OAuth (Google)
// ========================================
import {
  GoogleAuthController,
  GoogleLoginUseCase,
} from './authentication/oauth'

// ========================================
// AUTHENTICATION - Two-Factor (2FA)
// ========================================
import {
  TwoFactorController,
  TwoFactorTokenService,
  Verify2FACodeUseCase,
  Resend2FACodeUseCase,
} from './authentication/two-factor'

// ========================================
// AUTHENTICATION - Setup (First-time credentials)
// ========================================
import {
  SetupCredentialsController,
  SetupPasswordUseCase,
} from './authentication/setup'

// ========================================
// RECOVERY - Password Reset
// ========================================
import {
  PasswordResetController,
  RequestResetPasswordUseCase,
  ResetPasswordUseCase,
} from './recovery/password'

// ========================================
// RECOVERY - Email Verification
// ========================================
import {
  EmailVerificationController,
  EmailVerificationTokenService,
  RequestEmailVerificationUseCase,
  VerifyEmailUseCase,
} from './recovery/email'

// ========================================
// SESSION - Management (Sessions CRUD)
// ========================================
import {
  SessionsController,
  ListSessionsUseCase,
  RevokeSessionUseCase,
  RevokeAllSessionsUseCase,
} from './session/management'

// ========================================
// SESSION - Devices (Trusted Devices)
// ========================================
import {
  TrustedDevicesController,
  TrustedDeviceRepository,
  DeviceFingerprintService,
  ListTrustedDevicesUseCase,
  RevokeTrustedDeviceUseCase,
  RevokeAllTrustedDevicesUseCase,
} from './session/devices'

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
    SetupCredentialsController,
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
    SwitchRoleUseCase,

    // Password Reset
    RequestResetPasswordUseCase,
    ResetPasswordUseCase,

    // Two-Factor Authentication
    Verify2FACodeUseCase,
    Resend2FACodeUseCase,

    // Email Verification
    RequestEmailVerificationUseCase,
    VerifyEmailUseCase,

    // Setup Credentials
    SetupPasswordUseCase,

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

    JwtAuthGuard,
  ],
})
export class AuthModule {}

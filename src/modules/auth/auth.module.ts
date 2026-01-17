import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { APP_GUARD } from '@nestjs/core'
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
} from './login'

// ========================================
// TWO-FACTOR CONTEXT
// ========================================
import {
  TwoFactorController,
  TwoFactorTokenService,
  Generate2FACodeUseCase,
  Verify2FACodeUseCase,
  Resend2FACodeUseCase,
} from './two-factor'

// ========================================
// PASSWORD RESET CONTEXT
// ========================================
import {
  PasswordResetController,
  ResetPasswordTokenService,
  RequestResetPasswordUseCase,
  ResetPasswordUseCase,
  ResetPasswordRateLimitPolicy,
} from './password-reset'

// ========================================
// TRUSTED DEVICES CONTEXT
// ========================================
import { TrustedDeviceService } from './trusted-devices'

// ========================================
// SHARED INFRASTRUCTURE
// ========================================
import {
  JwtStrategy,
  JwtRefreshStrategy,
  JwtAuthGuard,
  JwtTokenHelper,
} from './shared'

@Module({
  imports: [
    // Configuración de Passport
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false,
    }),

    // Configuración de JWT para access tokens
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>(
          'JWT_SECRET',
          'your-secret-key-change-in-production',
        )
        const expiresIn = configService.get<string>(
          'JWT_EXPIRES_IN',
          '15m',
        ) as ms.StringValue

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

  controllers: [AuthController, PasswordResetController, TwoFactorController],

  providers: [
    // ========================================
    // Helpers
    // ========================================
    JwtTokenHelper,

    // ========================================
    // Services
    // ========================================
    TokensService,
    ResetPasswordTokenService,
    TwoFactorTokenService,
    TrustedDeviceService,

    ConfigService,

    // ========================================
    // Policies
    // ========================================
    LoginRateLimitPolicy,
    ResetPasswordRateLimitPolicy,

    // ========================================
    // Use Cases
    // ========================================
    // Login/Logout/Refresh
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,

    // Password Reset
    RequestResetPasswordUseCase,
    ResetPasswordUseCase,

    // Two-Factor Authentication
    Generate2FACodeUseCase,
    Verify2FACodeUseCase,
    Resend2FACodeUseCase,

    // ========================================
    // Passport Strategies
    // ========================================
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    // ========================================
    // Global Guards (registrados como APP_GUARD)
    // ========================================
    /*     {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // ✅ Protege TODAS las rutas por defecto (usar @Public() para excepciones)
    }, */
  ],

  exports: [
    // Exportar helper para otros módulos si lo necesitan
    JwtTokenHelper,
    // Exportar services si otros módulos los necesitan
    TokensService,
    ResetPasswordTokenService,
    TwoFactorTokenService,
    TrustedDeviceService,
    // Exportar guards para uso manual si es necesario
    JwtAuthGuard,
  ],
})
export class AuthModule {}

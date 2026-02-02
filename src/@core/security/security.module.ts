import { Module, Global } from '@nestjs/common'
import {
  OtpCoreService,
  PasswordHashService,
  PasswordGeneratorService,
  RateLimitService,
} from './services'

/**
 * Security Module
 *
 * Módulo global que proporciona servicios de seguridad reutilizables:
 * - PasswordHashService: Hashing de contraseñas con bcrypt
 * - PasswordGeneratorService: Generación de contraseñas aleatorias seguras
 * - RateLimitService: Rate limiting para prevenir fuerza bruta
 * - OtpCoreService: Gestión de tokens OTP con Redis
 *
 * Al ser @Global(), sus providers están disponibles en toda la aplicación
 * sin necesidad de importar el módulo explícitamente
 */
@Global()
@Module({
  providers: [
    PasswordHashService,
    PasswordGeneratorService,
    RateLimitService,
    OtpCoreService,
  ],
  exports: [
    PasswordHashService,
    PasswordGeneratorService,
    RateLimitService,
    OtpCoreService,
  ],
})
export class SecurityModule {}

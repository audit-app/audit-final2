import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { LOGIN_CONSTRAINTS } from '../../shared/constants'

/**
 * DTO para el login de usuarios
 *
 * Acepta email o username como identificador
 * Las validaciones son FLEXIBLES (solo límites, no complejidad)
 * porque debe aceptar cualquier password existente
 */
export class LoginDto {
  @ApiProperty({
    description: 'Email o username del usuario',
    example: 'admin@gmail.com',
    maxLength: LOGIN_CONSTRAINTS.USERNAME_OR_EMAIL.MAX,
  })
  @IsString()
  @IsNotEmpty({ message: LOGIN_CONSTRAINTS.USERNAME_OR_EMAIL.MESSAGE })
  @MaxLength(LOGIN_CONSTRAINTS.USERNAME_OR_EMAIL.MAX)
  usernameOrEmail: string

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Password123!',
    maxLength: LOGIN_CONSTRAINTS.PASSWORD.MAX,
  })
  @IsString()
  @IsNotEmpty({ message: LOGIN_CONSTRAINTS.PASSWORD.MESSAGE })
  @MaxLength(LOGIN_CONSTRAINTS.PASSWORD.MAX)
  password: string

  @ApiPropertyOptional({
    description:
      'Fingerprint del dispositivo (opcional, para trusted devices). Si no se proporciona, el backend lo generará.',
    example: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  deviceFingerprint?: string
}

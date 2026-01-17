import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

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
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'El email o username es requerido' })
  @MaxLength(255)
  usernameOrEmail: string

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Password123!',
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MaxLength(128)
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

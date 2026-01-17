import { ApiProperty } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator'

/**
 * DTO para resetear la contraseña usando el token
 *
 * El usuario proporciona:
 * 1. Token de reset (recibido por email)
 * 2. Nueva contraseña (con requisitos de complejidad)
 *
 * El sistema valida el token (JWT + Redis) y actualiza la contraseña
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de reset password (JWT)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  @MinLength(10)
  @MaxLength(1000)
  token: string

  @ApiProperty({
    description: 'Nueva contraseña (debe cumplir requisitos de complejidad)',
    example: 'NewSecurePass123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @MaxLength(128, {
    message: 'La contraseña no puede exceder 128 caracteres',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]+$/,
    {
      message:
        'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
    },
  )
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  newPassword: string
}

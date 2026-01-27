import { IsNumberString } from '@core/i18n'
import { ApiProperty } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator'

/**
 * DTO para resetear la contraseña con doble validación
 *
 * El usuario proporciona:
 * 1. tokenId (64 chars hex) - recibido en la respuesta HTTP del request
 * 2. otpCode (6 dígitos) - recibido en su correo electrónico
 * 3. Nueva contraseña (con requisitos de complejidad)
 *
 * El sistema valida AMBOS códigos (doble factor) antes de permitir el cambio
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token ID de reset password (64 caracteres hexadecimales)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
    minLength: 64,
    maxLength: 64,
  })
  @IsString({ message: 'El tokenId debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El tokenId es requerido' })
  @MinLength(64, { message: 'El tokenId debe tener 64 caracteres' })
  @MaxLength(64, { message: 'El tokenId debe tener 64 caracteres' })
  tokenId: string

  @ApiProperty({
    description: 'Código OTP de 6 dígitos (recibido por correo)',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: 'El código OTP debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El código OTP es requerido' })
  @MinLength(6, { message: 'El código OTP debe tener 6 dígitos' })
  @MaxLength(6, { message: 'El código OTP debe tener 6 dígitos' })
  @IsNumberString()
  otpCode: string

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

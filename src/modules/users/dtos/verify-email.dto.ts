import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from '@core/i18n'
import { ApiProperty } from '@nestjs/swagger'
import { USER_CONSTRAINTS } from '../constants/user-schema.constants'

/**
 * DTO para verificar email y establecer contraseña inicial
 */
export class VerifyEmailDto {
  @ApiProperty({
    description: 'Token de verificación enviado por email',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string

  @ApiProperty({
    description:
      'Contraseña inicial del usuario (mínimo 8 caracteres con mayúsculas, minúsculas, números y caracteres especiales)',
    example: 'MySecurePass123!',
    minLength: USER_CONSTRAINTS.PASSWORD.MIN,
    maxLength: USER_CONSTRAINTS.PASSWORD.MAX,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(USER_CONSTRAINTS.PASSWORD.MIN, {
    message: `La contraseña debe tener al menos ${USER_CONSTRAINTS.PASSWORD.MIN} caracteres`,
  })
  @MaxLength(USER_CONSTRAINTS.PASSWORD.MAX, {
    message: `La contraseña no puede exceder ${USER_CONSTRAINTS.PASSWORD.MAX} caracteres`,
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
    {
      message:
        'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&#)',
    },
  )
  password: string
}

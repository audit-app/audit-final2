import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO para establecer contraseña inicial después de verificar email
 *
 * El usuario recibe un setupToken temporal al verificar su email
 * y puede usarlo para establecer su contraseña en un plazo de 15 minutos
 */
export class SetupPasswordDto {
  @ApiProperty({
    description: 'Token temporal de setup (obtenido al verificar email)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  setupToken: string

  @ApiProperty({
    description:
      'Nueva contraseña (debe contener mayúscula, minúscula, número y carácter especial)',
    example: 'MySecurePass123!',
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
  password: string
}

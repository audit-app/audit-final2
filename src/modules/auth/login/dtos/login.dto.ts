import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean } from '@core/i18n'

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
    description: '¿Recuérdame? (opcional)',
    example: true,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    return value === 'true' || value === true || value === 1 || value === '1'
  })
  @IsBoolean()
  rememberMe: boolean = false
}

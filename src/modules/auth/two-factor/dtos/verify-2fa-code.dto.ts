import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  MaxLength,
  MinLength,
  IsOptional,
  IsBoolean,
} from 'class-validator'

/**
 * DTO para verificar un código 2FA
 *
 * El usuario proporciona:
 * 1. userId - ID del usuario que recibió el código
 * 2. code - Código numérico de 6 dígitos recibido por email
 * 3. token - TokenId de 64 caracteres (NO es JWT, es el identificador de sesión 2FA)
 *
 * El sistema valida:
 * 1. TokenId existe en Redis (sesión 2FA válida)
 * 2. Código coincide con el almacenado en Redis
 * 3. UserId coincide con el del payload
 * 4. Control de intentos: máximo 3 intentos
 * 5. Elimina el tokenId de Redis después de validación exitosa (un solo uso)
 *
 * SEGURIDAD: El tokenId es obligatorio para vincular el código con la sesión del usuario
 */
export class Verify2FACodeDto {
  @ApiProperty({
    description: 'ID del usuario',
    example: '550e8400-e29b-41d4-a716-446655440000',
    maxLength: 255,
  })
  @IsString({ message: 'El userId debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El userId es requerido' })
  @MaxLength(255)
  userId: string

  @ApiProperty({
    description: 'Código numérico de 6 dígitos',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @Length(6, 6, {
    message: 'El código debe tener exactamente 6 dígitos',
  })
  @Matches(/^\d{6}$/, {
    message: 'El código debe tener exactamente 6 dígitos numéricos',
  })
  @IsNotEmpty({ message: 'El código es requerido' })
  code: string

  @ApiProperty({
    description:
      'TokenId de 64 caracteres hexadecimales (NO es JWT, es el identificador de sesión 2FA). ' +
      'Este tokenId se recibe al hacer login cuando 2FA está habilitado.',
    example: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd',
    required: true,
    minLength: 64,
    maxLength: 64,
  })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  @MinLength(64, { message: 'El tokenId debe tener 64 caracteres' })
  @MaxLength(64, { message: 'El tokenId debe tener 64 caracteres' })
  token: string

  @ApiPropertyOptional({
    description:
      '¿Confiar en este dispositivo? Si es true, el usuario no necesitará 2FA en este dispositivo por 90 días',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'trustDevice debe ser un booleano (true o false)' })
  trustDevice?: boolean

  @ApiPropertyOptional({
    description:
      'Fingerprint del dispositivo (opcional). Si no se proporciona pero trustDevice=true, el backend lo generará automáticamente.',
    example: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234',
    maxLength: 64,
  })
  @IsOptional()
  @IsString({ message: 'deviceFingerprint debe ser una cadena de texto' })
  @MaxLength(64)
  deviceFingerprint?: string
}

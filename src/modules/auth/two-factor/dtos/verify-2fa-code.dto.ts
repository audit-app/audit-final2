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
 * 2. code - Código numérico recibido por email
 * 3. token - Token JWT REQUERIDO (vincula sesión con código)
 *
 * El sistema valida:
 * 1. JWT (firma y expiración) - OBLIGATORIO
 * 2. Código existe en Redis y no ha expirado
 * 3. Código coincide con el tokenId del JWT
 * 4. Elimina el código de Redis (un solo uso)
 *
 * SEGURIDAD: El token es obligatorio para prevenir ataques sin sesión
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
      'Token JWT requerido para validación (vincula sesión con código)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
    minLength: 10,
    maxLength: 1000,
  })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  @MinLength(10)
  @MaxLength(1000)
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

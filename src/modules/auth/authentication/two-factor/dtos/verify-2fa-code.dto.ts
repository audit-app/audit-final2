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
 * El frontend solo envía:
 * 1. token - TokenId de 64 caracteres (contiene el userId en el payload de Redis)
 * 2. code - Código numérico de 6 dígitos recibido por email
 * 3. trustDevice - (Opcional) Si quiere confiar en este dispositivo
 *
 * El sistema valida:
 * 1. TokenId existe en Redis (sesión 2FA válida)
 * 2. Código coincide con el almacenado en Redis
 * 3. Extrae userId del payload almacenado en Redis
 * 4. Control de intentos: máximo 3 intentos
 * 5. Elimina el tokenId de Redis después de validación exitosa (un solo uso)
 *
 * SEGURIDAD:
 * - El userId NO se envía desde el frontend (más seguro)
 * - El userId está vinculado al token en el backend
 * - No se puede manipular el userId desde el cliente
 */
export class Verify2FACodeDto {
  @ApiProperty({
    description:
      'TokenId de 64 caracteres hexadecimales (NO es JWT, es el identificador de sesión 2FA). ' +
      'Este tokenId se recibe al hacer login cuando 2FA está habilitado. ' +
      'Contiene el userId en el payload almacenado en Redis.',
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

  @ApiPropertyOptional({
    description:
      '¿Confiar en este dispositivo? Si es true, el usuario no necesitará 2FA en este dispositivo por 90 días. ' +
      'El backend generará automáticamente el fingerprint del dispositivo usando User-Agent e IP.',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'trustDevice debe ser un booleano (true o false)' })
  trustDevice?: boolean
}

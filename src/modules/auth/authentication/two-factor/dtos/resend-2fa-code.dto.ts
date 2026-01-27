import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator'

/**
 * DTO para reenviar un código 2FA
 *
 * IMPORTANTE: NO genera un nuevo código, reenvía el MISMO código existente
 *
 * El sistema:
 * 1. Obtiene el código existente usando el tokenId
 * 2. Reenvía el MISMO código por email
 * 3. El tokenId y código NO cambian
 * 4. Aplica cooldown de 60 segundos entre resends
 *
 * Flujo:
 * - Usuario hace login → recibe tokenId (64 chars) + OTP por email
 * - Si no le llegó el email → llama a resend con el tokenId
 * - Se reenvía el MISMO OTP al correo
 */
export class Resend2FACodeDto {
  @ApiProperty({
    description:
      'TokenId de 64 caracteres hexadecimales (NO es JWT, es el identificador de sesión 2FA)',
    example: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd',
    minLength: 64,
    maxLength: 64,
  })
  @IsString({ message: 'El tokenId debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El tokenId es requerido' })
  @MinLength(64, { message: 'El tokenId debe tener 64 caracteres' })
  @MaxLength(64, { message: 'El tokenId debe tener 64 caracteres' })
  token: string
}

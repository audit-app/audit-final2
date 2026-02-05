import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Length } from 'class-validator'

/**
 * DTO para reenviar código de reset password
 *
 * El usuario proporciona el tokenId que recibió en /request-reset
 * y el sistema reenvía el MISMO código OTP por email.
 */
export class ResendResetPasswordDto {
  @ApiProperty({
    description:
      'Token ID de 64 caracteres recibido en la respuesta de /request-reset',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
    minLength: 64,
    maxLength: 64,
  })
  @IsString({ message: 'El tokenId debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El tokenId es requerido' })
  @Length(64, 64, {
    message: 'El tokenId debe tener exactamente 64 caracteres',
  })
  tokenId: string
}

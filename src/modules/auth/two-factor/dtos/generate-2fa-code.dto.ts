import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator'

export class Generate2FACodeDto {
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
}

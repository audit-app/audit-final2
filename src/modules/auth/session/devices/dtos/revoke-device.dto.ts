import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator'

/**
 * DTO para revocar un dispositivo confiable
 */
export class RevokeDeviceDto {
  @ApiProperty({
    description: 'Fingerprint del dispositivo a revocar',
    example: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
  })
  @IsString({ message: 'El fingerprint debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El fingerprint es requerido' })
  @MinLength(32, {
    message: 'El fingerprint debe tener al menos 32 caracteres',
  })
  @MaxLength(128, {
    message: 'El fingerprint no puede exceder 128 caracteres',
  })
  fingerprint: string
}

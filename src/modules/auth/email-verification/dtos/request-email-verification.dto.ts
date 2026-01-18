import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty } from 'class-validator'

/**
 * DTO para solicitar reenvío de email de verificación
 */
export class RequestEmailVerificationDto {
  @ApiProperty({
    description: 'Email del usuario que solicita verificación',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string
}

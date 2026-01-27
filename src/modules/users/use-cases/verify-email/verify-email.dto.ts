import { IsString, IsNotEmpty } from '@core/i18n'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO para verificar email (Users module)
 *
 * El usuario solo proporciona el token de verificación.
 * Una vez verificado el email, el usuario recibirá un setupToken
 * para configurar su método de inicio de sesión (password o Google).
 */
export class UserVerifyEmailDto {
  @ApiProperty({
    description: 'Token de verificación enviado por email',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string
}

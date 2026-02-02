import { IsEmail, MaxLength } from '@core/i18n'
import { ApiProperty } from '@nestjs/swagger'
import { USER_CONSTRAINTS } from '../../../../users/constants/user-schema.constants'

/**
 * DTO para cambiar email de usuario (solo ADMIN)
 *
 * IMPORTANTE:
 * - Este endpoint es ADMIN-ONLY
 * - Genera nueva contraseña temporal
 * - Revoca todas las sesiones activas
 * - Envía welcome email con nuevas credenciales
 * - Resetea firstLoginAt (usuario debe volver a hacer login)
 */
export class ChangeUserEmailDto {
  @ApiProperty({
    description: 'Nuevo email del usuario',
    example: 'nuevo.email@example.com',
    maxLength: USER_CONSTRAINTS.EMAIL.MAX,
  })
  @IsEmail()
  @MaxLength(USER_CONSTRAINTS.EMAIL.MAX)
  newEmail: string
}

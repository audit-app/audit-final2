import { IsNotEmpty, MinLength, MaxLength } from '@core/i18n'
import { ApiProperty } from '@nestjs/swagger'
import { USER_CONSTRAINTS } from '../../../../users/constants/user-schema.constants'

/**
 * DTO para cambiar contraseña (self-service)
 *
 * Diferencia con ResetPasswordDto:
 * - Este requiere la contraseña ACTUAL (el usuario la conoce)
 * - NO usa token OTP
 * - Para usuarios autenticados que quieren cambiar su password
 *
 * Endpoint: PATCH /auth/profile/password
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual del usuario',
    example: 'OldPassword123!',
    minLength: USER_CONSTRAINTS.PASSWORD.MIN,
    maxLength: USER_CONSTRAINTS.PASSWORD.MAX,
  })
  @IsNotEmpty()
  @MinLength(USER_CONSTRAINTS.PASSWORD.MIN)
  @MaxLength(USER_CONSTRAINTS.PASSWORD.MAX)
  currentPassword: string

  @ApiProperty({
    description: 'Nueva contraseña',
    example: 'NewPassword123!',
    minLength: USER_CONSTRAINTS.PASSWORD.MIN,
    maxLength: USER_CONSTRAINTS.PASSWORD.MAX,
  })
  @IsNotEmpty()
  @MinLength(USER_CONSTRAINTS.PASSWORD.MIN)
  @MaxLength(USER_CONSTRAINTS.PASSWORD.MAX)
  newPassword: string
}

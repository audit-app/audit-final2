import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Role, UserStatus } from '../../../users/entities/user.entity'

/**
 * DTO de respuesta del login
 *
 * Contiene el access token y la información básica del usuario
 * El refresh token se envía en una HTTP-only cookie (no en el body)
 *
 * Campos opcionales para 2FA:
 * - require2FA: Indica si se requiere verificación de código 2FA
 * - twoFactorToken: Token temporal para validar el código 2FA
 * - deviceFingerprint: Fingerprint del dispositivo generado por el backend
 */
export class LoginResponseDto {
  @ApiProperty({
    description:
      'Access token JWT (válido por 15 minutos). Vacío si requiere 2FA.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken: string

  @ApiProperty({
    description: 'Información del usuario autenticado',
  })
  user: {
    id: string
    email: string
    username: string
    fullName: string
    roles: Role[]
    organizationId: string
    status: UserStatus
  }

  @ApiPropertyOptional({
    description:
      'Indica si se requiere verificación de código 2FA. Si es true, el accessToken estará vacío hasta verificar el código.',
    example: false,
  })
  require2FA?: boolean

  @ApiPropertyOptional({
    description:
      'Token temporal para validar el código 2FA. Solo presente cuando require2FA=true. El cliente debe enviarlo en la verificación del código.',
    example: 'a1b2c3d4e5f6...',
  })
  twoFactorToken?: string

  @ApiPropertyOptional({
    description:
      'Fingerprint del dispositivo generado por el backend. El cliente debe guardarlo para futuros logins.',
    example: 'sha256hash...',
  })
  deviceFingerprint?: string
}

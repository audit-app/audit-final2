import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * DTO de respuesta del login
 *
 * DISEÑO ESTÁNDAR:
 * - Solo devuelve el accessToken (y refreshToken en cookie HTTP-only)
 * - NO incluye datos del usuario (usar /auth/me para obtenerlos)
 * - Si requiere 2FA: accessToken vacío + require2FA=true + twoFactorToken
 *
 * Flujo recomendado:
 * 1. POST /auth/login → { accessToken: "jwt" }
 * 2. GET /auth/me → { id, email, username, ... }
 *
 * Flujo con 2FA:
 * 1. POST /auth/login → { accessToken: "", require2FA: true, twoFactorToken: "..." }
 * 2. POST /auth/2fa/verify → { valid: true, accessToken: "jwt" }
 * 3. GET /auth/me → { id, email, username, ... }
 */
export class LoginResponseDto {
  @ApiProperty({
    description:
      'Access token JWT (válido por 15 minutos). ' +
      'Vacío si requiere 2FA. ' +
      'Usar este token para llamar a /auth/me y obtener los datos del usuario.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken: string

  @ApiPropertyOptional({
    description:
      'Indica si se requiere verificación de código 2FA. ' +
      'Si es true, el accessToken estará vacío hasta verificar el código. ' +
      'El frontend debe mostrar la pantalla de verificación 2FA.',
    example: false,
  })
  require2FA?: boolean

  @ApiPropertyOptional({
    description:
      'Token temporal para validar el código 2FA. ' +
      'Solo presente cuando require2FA=true. ' +
      'El cliente debe enviarlo en POST /auth/2fa/verify junto con el código recibido por email.',
    example: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd',
  })
  twoFactorToken?: string
}

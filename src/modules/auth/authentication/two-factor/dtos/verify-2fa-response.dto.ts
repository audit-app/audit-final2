import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO de respuesta para verificación de código 2FA
 *
 * Este DTO representa el contenido del campo 'data' en la respuesta envuelta.
 * Contiene el resultado de la verificación y el access token para acceder a la aplicación.
 *
 * NOTA: El refreshToken y deviceId se envían en cookies HTTP-only, no en el body.
 */
export class Verify2FAResponseDto {
  @ApiProperty({
    description: 'Indica si el código 2FA fue válido',
    example: true,
  })
  valid: boolean

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Código verificado exitosamente. Sesión iniciada.',
  })
  message: string

  @ApiProperty({
    description:
      'Access token JWT para autenticación. El refresh token se envía en cookie HTTP-only.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string
}

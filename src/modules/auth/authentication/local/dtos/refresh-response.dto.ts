import { ApiProperty } from '@nestjs/swagger'

export class RefreshResponseDto {
  @ApiProperty({
    description:
      'Nuevo access token JWT. El refresh token se rota automáticamente y se envía en cookie HTTP-only.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string
}

import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsUUID } from 'class-validator'

/**
 * DTO para revocar una sesión específica
 */
export class RevokeSessionDto {
  @ApiProperty({
    description: 'ID de la sesión a revocar (tokenId)',
    example: 'a1b2c3d4-e5f6-4321-a1b2-c3d4e5f6a7b8',
  })
  @IsUUID('4', { message: 'El sessionId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El sessionId es requerido' })
  sessionId: string
}

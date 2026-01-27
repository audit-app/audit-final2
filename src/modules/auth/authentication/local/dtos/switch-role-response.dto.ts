import { ApiProperty } from '@nestjs/swagger'
import { Role } from '../../../../users/entities/user.entity'

/**
 * Response DTO para el cambio de rol
 *
 * Contiene el nuevo access token con el rol activo cambiado
 * y la información del nuevo rol activo
 */
export class SwitchRoleResponseDto {
  @ApiProperty({
    description: 'Nuevo access token con el rol activo cambiado',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string

  @ApiProperty({
    description: 'Rol activo actual después del cambio',
    enum: Role,
    example: Role.AUDITOR,
  })
  currentRole: Role

  @ApiProperty({
    description: 'Lista de todos los roles disponibles del usuario',
    enum: Role,
    isArray: true,
    example: [Role.GERENTE, Role.AUDITOR],
  })
  availableRoles: Role[]
}

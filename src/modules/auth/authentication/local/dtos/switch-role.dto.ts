import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'
import { Role } from '@core'

/**
 * DTO para cambiar el rol activo del usuario autenticado
 *
 * El usuario debe tener asignado el rol solicitado en su perfil
 * para poder cambiarse a ese rol.
 */
export class SwitchRoleDto {
  @ApiProperty({
    description: 'Nuevo rol activo que el usuario quiere usar',
    enum: Role,
    example: Role.AUDITOR,
  })
  @IsEnum(Role, {
    message:
      'El rol debe ser uno de los valores permitidos: ADMIN, GERENTE, AUDITOR, CLIENTE',
  })
  newRole: Role
}

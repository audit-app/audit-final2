import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'
import { Role } from '@core'

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

import { PartialType, OmitType } from '@nestjs/swagger'
import { CreateUserDto } from '../create-user/create-user.dto'

/**
 * DTO para actualizar usuario
 *
 * IMPORTANTE:
 * - NO se puede cambiar 'email' aquí (es la identidad del usuario)
 * - Para cambiar email usar endpoint especial: POST /users/:id/change-email (solo admin)
 * - NO se puede cambiar 'organizationId' (afecta permisos y auditorías)
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'organizationId'] as const),
) {}

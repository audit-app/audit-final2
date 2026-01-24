import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Role } from 'src/modules/users/entities'

/**
 * DTO de respuesta para el endpoint GET /auth/me
 *
 * Extiende UserResponseDto agregando rutas de navegación
 * basadas en el rol del usuario
 */

export class UserResponseDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string

  @ApiProperty({
    description: 'Nombres del usuario',
    example: 'Juan Carlos',
  })
  names: string

  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'Pérez García',
  })
  lastNames: string

  @ApiProperty({
    description: 'Nombre de usuario único',
    example: 'juan_perez',
  })
  username: string

  @ApiPropertyOptional({
    description: 'URL de la imagen de perfil',
    example: 'https://example.com/images/profile.jpg',
    nullable: true,
  })
  image: string | null

  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan.perez@example.com',
  })
  email: string

  @ApiProperty({
    enum: Role,
    isArray: true,
    description: 'Roles asignados al usuario',
    example: [Role.AUDITOR],
  })
  roles: Role[]

  ci: string

  address: string | null

  phone: string | null

  @ApiProperty({
    enum: Role,
    description: 'Rol activo actual del usuario en esta sesión',
    example: Role.AUDITOR,
  })
  currentRole: Role

  @ApiProperty({
    description: 'ID de la organización a la que pertenece',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  organizationId: string

  @ApiProperty({
    description: 'Nombre de la organización',
    example: 'Empresa S.A.',
  })
  organizationName: string

  @ApiPropertyOptional({
    description: 'URL de la imagen de la organización',
    example: 'https://example.com/images/org-logo.jpg',
    nullable: true,
  })
  organizationImage: string | null
}

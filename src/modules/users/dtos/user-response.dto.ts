import { Role } from '@core'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

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
    description: 'Email del usuario',
    example: 'juan.perez@example.com',
  })
  email: string

  @ApiProperty({
    description: 'Nombre de usuario único',
    example: 'juan_perez',
  })
  username: string

  @ApiProperty({
    description: 'Cédula de identidad',
    example: '1234567-8',
  })
  ci: string

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+591 2 234 5678',
    nullable: true,
  })
  phone: string | null

  @ApiPropertyOptional({
    description: 'Dirección del usuario',
    example: 'Av. 6 de Agosto #123',
    nullable: true,
  })
  address: string | null

  @ApiPropertyOptional({
    description: 'URL de la imagen de perfil',
    example: 'https://example.com/images/profile.jpg',
    nullable: true,
  })
  image: string | null

  @ApiProperty({
    description: 'Estado del usuario',
    example: true,
  })
  isActive: boolean

  @ApiProperty({
    description: 'Indica si el usuario debe cambiar su contraseña temporal',
    example: true,
  })
  isTemporaryPassword: boolean

  @ApiPropertyOptional({
    description: 'Fecha y hora del primer login del usuario',
    example: '2024-01-15T10:30:00.000Z',
    nullable: true,
  })
  firstLoginAt: Date | null

  @ApiProperty({
    description: 'Indica si el usuario tiene 2FA habilitado',
    example: false,
  })
  isTwoFactorEnabled: boolean

  @ApiProperty({
    enum: Role,
    isArray: true,
    description: 'Roles asignados al usuario',
    example: [Role.AUDITOR],
  })
  roles: Role[]

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

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date
}

import { ApiProperty } from '@nestjs/swagger'

export class OrganizationResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único de la organización',
  })
  id: string

  @ApiProperty({
    example: 'Coca Cola Bolivia',
    description: 'Nombre de la organización',
  })
  name: string

  @ApiProperty({
    example: '1234567890',
    description: 'NIT de la organización',
  })
  nit: string

  @ApiProperty({
    example: 'Empresa líder en la industria de bebidas',
    description: 'Descripción de la organización',
    required: false,
    nullable: true,
  })
  description: string | null

  @ApiProperty({
    example: 'Av. Siempre Viva 123, La Paz',
    description: 'Dirección física de la organización',
    required: false,
    nullable: true,
  })
  address: string | null

  @ApiProperty({
    example: '+591 2 1234567',
    description: 'Teléfono de contacto',
    required: false,
    nullable: true,
  })
  phone: string | null

  @ApiProperty({
    example: 'info@cocacola.bo',
    description: 'Correo electrónico de contacto',
    required: false,
    nullable: true,
  })
  email: string | null

  @ApiProperty({
    example: '/uploads/organizations/logos/org-123.png',
    description: 'URL del logo de la organización',
    required: false,
    nullable: true,
  })
  logoUrl: string | null

  @ApiProperty({
    example: true,
    description: 'Indica si la organización está activa',
  })
  isActive: boolean

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Fecha de creación',
  })
  createdAt: string

  @ApiProperty({
    example: '2024-06-20T14:45:00Z',
    description: 'Fecha de última actualización',
  })
  updatedAt: string
}

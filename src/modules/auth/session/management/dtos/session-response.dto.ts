import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO de respuesta para una sesión activa
 *
 * Representa una sesión (refresh token) activa del usuario.
 * Usado para mostrar al usuario qué dispositivos tienen sesión activa.
 */
export class SessionResponseDto {
  @ApiProperty({
    description: 'ID de la sesión (tokenId)',
    example: 'a1b2c3d4-e5f6-4321-a1b2-c3d4e5f6a7b8',
  })
  sessionId: string

  @ApiProperty({
    description: 'Dirección IP desde donde se inició la sesión',
    example: '192.168.1.100',
  })
  ip: string

  @ApiProperty({
    description: 'Navegador usado',
    example: 'Chrome 120',
    required: false,
  })
  browser?: string

  @ApiProperty({
    description: 'Sistema operativo',
    example: 'Windows 11',
    required: false,
  })
  os?: string

  @ApiProperty({
    description: 'Dispositivo',
    example: 'Desktop',
    required: false,
  })
  device?: string

  @ApiProperty({
    description: 'Fecha de creación de la sesión (timestamp Unix en ms)',
    example: 1705497600000,
  })
  createdAt: number

  @ApiProperty({
    description: 'Última actividad en la sesión (timestamp Unix en ms)',
    example: 1705497600000,
  })
  lastActiveAt: number

  @ApiProperty({
    description: 'Indica si esta es la sesión actual del usuario',
    example: true,
  })
  isCurrent: boolean
}

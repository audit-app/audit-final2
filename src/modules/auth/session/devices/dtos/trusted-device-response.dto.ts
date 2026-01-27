import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO de respuesta para un dispositivo confiable
 *
 * Representa un dispositivo donde el usuario tiene habilitado "Remember this device"
 * (no solicitar 2FA en futuros logins).
 */
export class TrustedDeviceResponseDto {
  @ApiProperty({
    description: 'Fingerprint del dispositivo (identificador único)',
    example: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
  })
  fingerprint: string

  @ApiProperty({
    description: 'Navegador usado',
    example: 'Chrome 120',
  })
  browser: string

  @ApiProperty({
    description: 'Sistema operativo',
    example: 'Windows 11',
  })
  os: string

  @ApiProperty({
    description: 'Dispositivo',
    example: 'Desktop',
  })
  device: string

  @ApiProperty({
    description: 'Dirección IP desde donde se agregó',
    example: '192.168.1.100',
  })
  ip: string

  @ApiProperty({
    description: 'Fecha de creación (timestamp Unix en ms)',
    example: 1705497600000,
  })
  createdAt: number

  @ApiProperty({
    description: 'Última fecha de uso (timestamp Unix en ms)',
    example: 1705497600000,
  })
  lastUsedAt: number
}

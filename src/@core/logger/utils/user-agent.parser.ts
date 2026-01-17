import { DeviceInfo } from '../types'

export class UserAgentParser {
  static parse(userAgent: string): DeviceInfo {
    // Si no hay UA, retornamos rápido
    if (!userAgent) {
      return {
        os: 'Unknown',
        browser: 'Unknown',
        device: 'Unknown',
        userAgent: '',
      }
    }

    return {
      os: this.parseOS(userAgent),
      browser: this.parseBrowser(userAgent),
      device: this.parseDevice(userAgent),
      userAgent,
    }
  }

  private static parseOS(userAgent: string): string {
    // El orden aquí está bastante bien
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac OS')) return 'macOS' // Cuidado: iOS tmb suele decir Mac OS X
    if (userAgent.includes('Linux') && !userAgent.includes('Android'))
      return 'Linux' // Android es Linux, hay que separarlo
    if (userAgent.includes('Android')) return 'Android'
    if (
      userAgent.includes('iOS') ||
      userAgent.includes('iPhone') ||
      userAgent.includes('iPad')
    )
      return 'iOS'
    return 'Unknown'
  }

  private static parseBrowser(userAgent: string): string {
    // 1. Los específicos PRIMERO
    if (userAgent.includes('Edg')) return 'Edge' // Edge moderno
    if (userAgent.includes('OPR') || userAgent.includes('Opera')) return 'Opera'
    if (userAgent.includes('Firefox')) return 'Firefox'

    // 2. Chrome (Después de descartar Edge y Opera)
    if (userAgent.includes('Chrome')) return 'Chrome'

    // 3. Safari (El último, porque Chrome también dice ser Safari)
    if (userAgent.includes('Safari')) return 'Safari'

    return 'Unknown'
  }

  private static parseDevice(userAgent: string): string {
    // Tablets primero (porque suelen decir Mobile también)
    if (userAgent.includes('iPad') || userAgent.includes('Tablet'))
      return 'Tablet'

    // Móviles
    if (
      userAgent.includes('Mobile') ||
      userAgent.includes('iPhone') ||
      userAgent.includes('Android')
    )
      return 'Mobile'

    return 'Desktop'
  }
}

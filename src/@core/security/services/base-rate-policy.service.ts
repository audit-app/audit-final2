import { TooManyAttemptsException } from 'src/modules/auth'
import { RateLimitService } from '../services/rate-limit.service'

export abstract class BaseRateLimitPolicy {
  /**
   * @param rateLimitService Instancia del servicio de Redis
   * @param contextPrefix Prefijo del contexto (ej: 'login', 'reset-pw', '2fa')
   * @param maxAttempts Límite de intentos permitidos
   * @param windowMinutes Tiempo de bloqueo (ventana) en minutos
   */
  constructor(
    protected readonly rateLimitService: RateLimitService,
    private readonly contextPrefix: string,
    protected readonly maxAttempts: number,
    protected readonly windowMinutes: number,
  ) {}

  /**
   * Construye la key compuesta.
   * Tu RateLimitService ya agrega 'rate-limit:', así que aquí solo agregamos el contexto.
   * Resultado final en Redis: rate-limit:login:admin@gmail.com
   */
  protected getKey(identifier: string): string {
    const normalizedId = identifier.toLowerCase().trim()
    return `${this.contextPrefix}:${normalizedId}`
  }

  /**
   * Verifica si el usuario puede intentar. Si no, lanza excepción.
   * Úsalo ANTES de procesar la lógica de negocio.
   */
  async checkLimitOrThrow(identifier: string): Promise<void> {
    const key = this.getKey(identifier)
    const canAttempt = await this.rateLimitService.checkLimit(
      key,
      this.maxAttempts,
    )

    if (!canAttempt) {
      const remainingSeconds =
        await this.rateLimitService.getTimeUntilReset(key)
      const minutes = Math.ceil(remainingSeconds / 60)

      throw new TooManyAttemptsException(
        `Has excedido el número de intentos para ${this.contextPrefix}. Inténtalo de nuevo en ${minutes} minutos.`,
      )
    }
  }

  /**
   * Registra un intento fallido.
   * Úsalo cuando la contraseña/código sea incorrecto.
   */
  async registerFailure(identifier: string): Promise<void> {
    const key = this.getKey(identifier)
    await this.rateLimitService.incrementAttempts(key, this.windowMinutes)
  }

  /**
   * Limpia el historial.
   * Úsalo cuando el login/validación sea exitoso.
   */
  async clearRecords(identifier: string): Promise<void> {
    const key = this.getKey(identifier)
    await this.rateLimitService.resetAttempts(key)
  }
}

import { TooManyAttemptsException } from '../../../modules/auth/shared/exceptions/too-many-attempts.exception'
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
   * Resultado final en Redis: rate-limit:login:admin@gmail.com
   */
  protected getKey(identifier: string): string {
    const normalizedId = identifier.toLowerCase().trim()
    return `${this.contextPrefix}:${normalizedId}`
  }

  // ==========================================
  // 1. MÉTODO BOOLEANO (Sin Exception)
  // ==========================================

  /**
   * Verifica si el usuario puede intentar, retornando true o false.
   * NO lanza excepción.
   * * Úsalo para:
   * - Request Reset Password (Silent Drop)
   * - Validaciones personalizadas donde quieras manejar el error tú mismo.
   * * @returns true si PUEDE intentar, false si está BLOQUEADO.
   */
  async canAttempt(identifier: string): Promise<boolean> {
    const key = this.getKey(identifier)
    // Retorna booleano directo del servicio
    return await this.rateLimitService.checkLimit(key, this.maxAttempts)
  }

  // ==========================================
  // 2. MÉTODO ESTRICTO (Con Exception)
  // ==========================================

  /**
   * Verifica si el usuario puede intentar. Si no, lanza excepción automática.
   * * Úsalo para:
   * - Login
   * - Validar OTP
   * - Cualquier lugar donde el usuario deba ver el mensaje de error "Espera X min".
   */
  async checkLimitOrThrow(identifier: string): Promise<void> {
    // Reutilizamos el método de arriba para verificar
    const allowed = await this.canAttempt(identifier)

    if (!allowed) {
      // Solo calculamos el tiempo si realmente vamos a lanzar el error
      const key = this.getKey(identifier)
      const remainingSeconds =
        await this.rateLimitService.getTimeUntilReset(key)
      const minutes = Math.ceil(remainingSeconds / 60)

      throw new TooManyAttemptsException(
        `Has excedido el número de intentos para ${this.contextPrefix}. Inténtalo de nuevo en ${minutes} minutos.`,
      )
    }
  }

  // ==========================================
  // 3. HELPERS
  // ==========================================

  /**
   * Registra un intento fallido.
   */
  async registerFailure(identifier: string): Promise<void> {
    const key = this.getKey(identifier)
    await this.rateLimitService.incrementAttempts(key, this.windowMinutes)
  }

  /**
   * Limpia el historial.
   */
  async clearRecords(identifier: string): Promise<void> {
    const key = this.getKey(identifier)
    await this.rateLimitService.resetAttempts(key)
  }
}

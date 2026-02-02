import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { LoggerService } from '@core/logger'
import { EmailService } from '../email.service'
import {
  Send2FAEmailEvent,
  SendResetPasswordEmailEvent,
  SendWelcomeEmailEvent,
} from '../events/email.events'

/**
 * Email Listener
 *
 * Escucha eventos de email y los procesa de forma asíncrona.
 * Esto desacopla el envío de emails de la lógica de negocio.
 *
 * ARQUITECTURA:
 * - EmailListener: Maneja eventos y delega el envío a EmailService
 * - EmailService: Core del sistema de emails (lógica de envío centralizada)
 *
 * Ventajas:
 * - No bloquea las respuestas HTTP (fire-and-forget)
 * - Manejo centralizado de errores
 * - Sin duplicación de código (usa EmailService internamente)
 * - Fácil de testear (puedes mockear EmailService)
 * - Escalable (puedes migrar a colas si es necesario)
 */
@Injectable()
export class EmailListener {
  constructor(
    private readonly logger: LoggerService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Escucha evento: Enviar código 2FA
   */
  @OnEvent('email.send.2fa', { async: true })
  async handleSend2FAEmail(event: Send2FAEmailEvent): Promise<void> {
    try {
      await this.emailService.sendTwoFactorCode(event.payload)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : undefined
      this.logger.error(`Error al enviar email 2FA: ${errorMessage}`, stack)
    }
  }

  /**
   * Escucha evento: Enviar email de reset password
   */
  @OnEvent('email.send.reset-password', { async: true })
  async handleSendResetPasswordEmail(
    event: SendResetPasswordEmailEvent,
  ): Promise<void> {
    try {
      await this.emailService.sendResetPasswordEmail(event.payload)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : undefined
      this.logger.error(
        `Error al enviar email de reset password: ${errorMessage}`,
        stack,
      )
    }
  }

  /**
   * Escucha evento: Enviar email de bienvenida con credenciales
   */
  @OnEvent('email.send.welcome', { async: true })
  async handleSendWelcomeEmail(event: SendWelcomeEmailEvent): Promise<void> {
    try {
      await this.emailService.sendWelcomeEmail(event.payload)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : undefined
      this.logger.error(
        `Error al enviar email de bienvenida: ${errorMessage}`,
        stack,
      )
    }
  }
}

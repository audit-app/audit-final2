import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import {
  Send2FAEmailEvent,
  SendResetPasswordEmailEvent,
  SendWelcomeEmailEvent,
} from './events/email.events'
import {
  TwoFactorEmailData,
  ResetPasswordEmailData,
  WelcomeEmailData,
} from './interfaces'

/**
 * Email Event Service
 *
 * Servicio para emitir eventos de email de forma asíncrona.
 * Los eventos son manejados por EmailListener que envía los emails en background.
 *
 * VENTAJAS sobre el servicio directo:
 * - No bloquea las respuestas HTTP (fire-and-forget)
 * - Manejo centralizado de errores en el listener
 * - Desacoplamiento entre lógica de negocio y envío de emails
 * - Fácil de testear (puedes mockear el EventEmitter)
 * - Escalable (puedes migrar a colas como Bull si lo necesitas)
 *
 * USO:
 * ```typescript
 * // En lugar de:
 * await this.emailService.sendTwoFactorCode(data)
 *
 * // Usar:
 * this.emailEventService.emitSend2FACode(data)
 * ```
 */
@Injectable()
export class EmailEventService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Emite evento: Enviar código 2FA
   * El email se envía de forma asíncrona sin bloquear la respuesta
   */
  emitSend2FACode(data: TwoFactorEmailData): void {
    const event = new Send2FAEmailEvent(data)
    this.eventEmitter.emit(event.eventName, event)
  }

  /**
   * Emite evento: Enviar email de reset password
   * El email se envía de forma asíncrona sin bloquear la respuesta
   */
  emitSendResetPassword(data: ResetPasswordEmailData): void {
    const event = new SendResetPasswordEmailEvent(data)
    this.eventEmitter.emit(event.eventName, event)
  }

  /**
   * Emite evento: Enviar email de bienvenida con credenciales
   * El email se envía de forma asíncrona sin bloquear la respuesta
   */
  emitSendWelcome(data: WelcomeEmailData): void {
    const event = new SendWelcomeEmailEvent(data)
    this.eventEmitter.emit(event.eventName, event)
  }
}

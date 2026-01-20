/**
 * Eventos de Email
 *
 * Estos eventos se emiten cuando se necesita enviar un email.
 * Los listeners manejan el envío real de forma asíncrona.
 */

export interface TwoFactorEmailPayload {
  to: string
  userName: string
  code: string
  expiresInMinutes: number
}

export interface ResetPasswordEmailPayload {
  to: string
  userName: string
  resetLink: string
  expiresInMinutes: number
}

export interface VerificationEmailPayload {
  to: string
  userName: string
  verificationLink: string
}

export interface WelcomeEmailPayload {
  to: string
  userName: string
  loginLink: string
}

/**
 * Clase base para eventos de email
 */
export abstract class EmailEvent {
  constructor(
    public readonly eventName: string,
    public readonly payload: unknown,
  ) {}
}

/**
 * Evento: Enviar código 2FA
 */
export class Send2FAEmailEvent extends EmailEvent {
  constructor(public readonly payload: TwoFactorEmailPayload) {
    super('email.send.2fa', payload)
  }
}

/**
 * Evento: Enviar email de reset password
 */
export class SendResetPasswordEmailEvent extends EmailEvent {
  constructor(public readonly payload: ResetPasswordEmailPayload) {
    super('email.send.reset-password', payload)
  }
}

/**
 * Evento: Enviar email de verificación
 */
export class SendVerificationEmailEvent extends EmailEvent {
  constructor(public readonly payload: VerificationEmailPayload) {
    super('email.send.verification', payload)
  }
}

/**
 * Evento: Enviar email de bienvenida
 */
export class SendWelcomeEmailEvent extends EmailEvent {
  constructor(public readonly payload: WelcomeEmailPayload) {
    super('email.send.welcome', payload)
  }
}

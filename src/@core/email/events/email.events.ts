import {
  ResetPasswordEmailData,
  TwoFactorEmailData,
  VerifyEmailData,
  WelcomeEmailData,
} from '../interfaces'

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
  constructor(public readonly payload: TwoFactorEmailData) {
    super('email.send.2fa', payload)
  }
}

/**
 * Evento: Enviar email de reset password
 */
export class SendResetPasswordEmailEvent extends EmailEvent {
  constructor(public readonly payload: ResetPasswordEmailData) {
    super('email.send.reset-password', payload)
  }
}

/**
 * Evento: Enviar email de verificación
 */
export class SendVerificationEmailEvent extends EmailEvent {
  constructor(public readonly payload: VerifyEmailData) {
    super('email.send.verification', payload)
  }
}

/**
 * Evento: Enviar email de bienvenida
 */
export class SendWelcomeEmailEvent extends EmailEvent {
  constructor(public readonly payload: WelcomeEmailData) {
    super('email.send.welcome', payload)
  }
}

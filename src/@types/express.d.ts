import { JwtPayload } from '../modules/auth/shared/interfaces'

/**
 * Extensión de tipos de Express para incluir propiedades personalizadas
 * añadidas por middlewares/guards de la aplicación
 */
declare global {
  namespace Express {
    /**
     * Request de Express extendido con propiedades de autenticación
     */
    interface Request {
      /**
       * Usuario autenticado añadido por JwtAuthGuard
       * Contiene el payload decodificado del JWT
       */
      user?: JwtPayload
    }
  }
}

export {}

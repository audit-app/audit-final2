/**
 * ⚠️ DEPRECADO: Decorador movido a @core/http
 *
 * El decorador @GetUser() ahora vive en @core/http/decorators/
 * porque es infraestructura HTTP genérica, no lógica de negocio de auth.
 *
 * ✅ NUEVO:
 * import { GetUser } from '@core/http'
 *
 * Este archivo se mantiene temporalmente para re-exportar.
 */

export { GetUser } from '@core/http'

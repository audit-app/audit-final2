/**
 * ⚠️ DEPRECADO: Decorador movido a @core/http
 *
 * El decorador @GetToken() ahora vive en @core/http/decorators/
 * porque es infraestructura HTTP genérica, no lógica de negocio de auth.
 *
 * ✅ NUEVO:
 * import { GetToken } from '@core/http'
 *
 * Este archivo se mantiene temporalmente para re-exportar.
 */

export { GetToken } from '@core/http'

/**
 * ⚠️ DEPRECADO: Guard movido a @core/http
 *
 * JwtAuthGuard ahora vive en @core/http/guards/
 * porque es infraestructura HTTP genérica, no lógica de negocio de auth.
 *
 * ✅ NUEVO:
 * import { JwtAuthGuard } from '@core/http'
 *
 * Este archivo se mantiene temporalmente para re-exportar.
 */

export { JwtAuthGuard } from '@core/http'

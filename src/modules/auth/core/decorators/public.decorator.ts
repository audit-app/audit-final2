/**
 * ⚠️ DEPRECADO: Decorador movido a @core/http
 *
 * El decorador @Public() y IS_PUBLIC_KEY ahora viven en @core/http/decorators/
 * porque son infraestructura HTTP genérica, no lógica de negocio de auth.
 *
 * ✅ NUEVO:
 * import { Public, IS_PUBLIC_KEY } from '@core/http'
 *
 * Este archivo se mantiene temporalmente para re-exportar.
 */

export { Public, IS_PUBLIC_KEY } from '@core/http'

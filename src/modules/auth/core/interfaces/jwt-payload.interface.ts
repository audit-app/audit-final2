/**
 * ⚠️ DEPRECADO: Interfaces movidas a @core/context
 *
 * Las interfaces JwtPayload, JwtRefreshPayload y el enum Role
 * ahora viven en @core/context porque son conceptos transversales
 * usados en auditoría, logging, cookies, etc.
 *
 * ✅ NUEVO:
 * import { JwtPayload, JwtRefreshPayload, Role } from '@core/context'
 *
 * Este archivo se mantiene temporalmente para re-exportar
 * y evitar romper imports existentes, pero eventualmente se eliminará.
 */

export type { JwtPayload, JwtRefreshPayload } from '@core/context'

/**
 * @deprecated Este archivo está deprecado.
 *
 * Use `SuccessResponseDto` de '@core/dtos/responses' en su lugar.
 * Este archivo se mantiene solo para compatibilidad hacia atrás.
 *
 * ANTES:
 * ```typescript
 * import { ApiStandardResponseDto } from '@core/dtos'
 * ```
 *
 * AHORA:
 * ```typescript
 * import { SuccessResponseDto } from '@core/dtos'
 * ```
 *
 * Este archivo será eliminado en una versión futura.
 */

import { SuccessResponseDto } from './responses/success-response.dto'

/**
 * @deprecated Use SuccessResponseDto en su lugar
 */
export class ApiStandardResponseDto extends SuccessResponseDto {}
